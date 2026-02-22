package connection

import (
	"context"
	"fmt"
	"io"
	"net"
	"os"
	"sync"

	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/agent"
)

// SSHAuthMethod identifies how to authenticate with the SSH server.
type SSHAuthMethod string

const (
	SSHAuthKey      SSHAuthMethod = "key"
	SSHAuthPassword SSHAuthMethod = "password"
	SSHAuthAgent    SSHAuthMethod = "agent"
)

// SSHTunnelConfig holds the parameters for an SSH tunnel.
type SSHTunnelConfig struct {
	Host       string        `json:"host"`
	Port       uint16        `json:"port"`       // default 22
	User       string        `json:"user"`
	AuthMethod SSHAuthMethod `json:"authMethod"` // key | password | agent
	PrivateKey string        `json:"privateKey"` // file path (authMethod=key)
	Passphrase string        `json:"passphrase"` // key passphrase (authMethod=key)
	Password   string        `json:"password"`   // SSH password (authMethod=password)
	RemoteHost string        `json:"remoteHost"` // DB host from SSH server's perspective
	RemotePort uint16        `json:"remotePort"` // DB port from SSH server's perspective
}

// Tunnel manages an SSH tunnel with a local TCP listener that forwards
// connections through an SSH client to a remote host:port.
type Tunnel struct {
	config    SSHTunnelConfig
	sshClient *ssh.Client
	listener  net.Listener
	done      chan struct{}
	wg        sync.WaitGroup
}

// NewTunnel creates a new Tunnel (not yet started).
func NewTunnel(config SSHTunnelConfig) *Tunnel {
	if config.Port == 0 {
		config.Port = 22
	}
	return &Tunnel{
		config: config,
		done:   make(chan struct{}),
	}
}

// Start dials the SSH server, starts a local TCP listener on a random port,
// and begins forwarding accepted connections to remoteHost:remotePort.
// Returns the local address for the database connector to use.
func (t *Tunnel) Start(ctx context.Context) (localHost string, localPort uint16, err error) {
	authMethods, err := t.buildAuthMethods()
	if err != nil {
		return "", 0, fmt.Errorf("ssh auth: %w", err)
	}

	sshConfig := &ssh.ClientConfig{
		User:            t.config.User,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // MVP: skip host key verification
	}

	sshAddr := fmt.Sprintf("%s:%d", t.config.Host, t.config.Port)
	t.sshClient, err = ssh.Dial("tcp", sshAddr, sshConfig)
	if err != nil {
		return "", 0, fmt.Errorf("ssh dial %s: %w", sshAddr, err)
	}

	t.listener, err = net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.sshClient.Close()
		return "", 0, fmt.Errorf("local listen: %w", err)
	}

	localAddr := t.listener.Addr().(*net.TCPAddr)

	t.wg.Add(1)
	go t.acceptLoop()

	return "127.0.0.1", uint16(localAddr.Port), nil
}

// Close stops the listener, closes the SSH client, and waits for goroutines.
func (t *Tunnel) Close() error {
	close(t.done)

	var firstErr error
	if t.listener != nil {
		if err := t.listener.Close(); err != nil {
			firstErr = err
		}
	}
	if t.sshClient != nil {
		if err := t.sshClient.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
	}

	t.wg.Wait()
	return firstErr
}

func (t *Tunnel) acceptLoop() {
	defer t.wg.Done()

	remoteAddr := fmt.Sprintf("%s:%d", t.config.RemoteHost, t.config.RemotePort)

	for {
		localConn, err := t.listener.Accept()
		if err != nil {
			select {
			case <-t.done:
				return
			default:
				continue
			}
		}

		t.wg.Add(1)
		go func() {
			defer t.wg.Done()
			t.forward(localConn, remoteAddr)
		}()
	}
}

func (t *Tunnel) forward(localConn net.Conn, remoteAddr string) {
	defer localConn.Close()

	remoteConn, err := t.sshClient.Dial("tcp", remoteAddr)
	if err != nil {
		return
	}
	defer remoteConn.Close()

	done := make(chan struct{}, 2)
	go func() {
		io.Copy(remoteConn, localConn)
		done <- struct{}{}
	}()
	go func() {
		io.Copy(localConn, remoteConn)
		done <- struct{}{}
	}()

	// Wait for one direction to finish, then return (defers close both).
	<-done
}

func (t *Tunnel) buildAuthMethods() ([]ssh.AuthMethod, error) {
	switch t.config.AuthMethod {
	case SSHAuthPassword:
		return []ssh.AuthMethod{ssh.Password(t.config.Password)}, nil

	case SSHAuthAgent:
		sock := os.Getenv("SSH_AUTH_SOCK")
		if sock == "" {
			return nil, fmt.Errorf("SSH_AUTH_SOCK not set")
		}
		conn, err := net.Dial("unix", sock)
		if err != nil {
			return nil, fmt.Errorf("connect to SSH agent: %w", err)
		}
		agentClient := agent.NewClient(conn)
		return []ssh.AuthMethod{ssh.PublicKeysCallback(agentClient.Signers)}, nil

	case SSHAuthKey, "": // default to key
		keyData, err := os.ReadFile(t.config.PrivateKey)
		if err != nil {
			return nil, fmt.Errorf("read private key %s: %w", t.config.PrivateKey, err)
		}

		var signer ssh.Signer
		if t.config.Passphrase != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase(keyData, []byte(t.config.Passphrase))
		} else {
			signer, err = ssh.ParsePrivateKey(keyData)
		}
		if err != nil {
			return nil, fmt.Errorf("parse private key: %w", err)
		}
		return []ssh.AuthMethod{ssh.PublicKeys(signer)}, nil

	default:
		return nil, fmt.Errorf("unsupported SSH auth method: %s", t.config.AuthMethod)
	}
}
