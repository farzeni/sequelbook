package connections

import (
	"fmt"
	"net"
	"os"
	"sequelbook/core/tools"

	_ "github.com/go-sql-driver/mysql" // MySQL driver
	_ "github.com/lib/pq"              // Postgres driver
	_ "github.com/mattn/go-sqlite3"    // SQLite driver
	"golang.org/x/crypto/ssh"
)

type ConnType string

const (
	ConnTypePostgres ConnType = "postgres"
	ConnTypeMySQL    ConnType = "mysql"
	ConnTypeSQLite   ConnType = "sqlite"
)

type Connection struct {
	ID   string           `json:"id"`
	Name string           `json:"name"`
	Type ConnType         `json:"type"`
	Host string           `json:"host"`
	Port int              `json:"port"`
	User string           `json:"user"`
	Pass string           `json:"pass"`
	DB   string           `json:"db"`
	Ssh  *SSHTunnelConfig `json:"ssh"`
}

type SSHTunnelConfig struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	User       string `json:"user"`
	PrivateKey string `json:"private_key"`
	Passphrase string `json:"passphrase"`
	RemoteHost string `json:"remote_host"`
	RemotePort int    `json:"remote_port"`
}
type ConnectionData struct {
	Name string           `json:"name"`
	Type ConnType         `json:"type"`
	Host string           `json:"host"`
	Port int              `json:"port"`
	User string           `json:"user"`
	Pass string           `json:"pass"`
	DB   string           `json:"db"`
	Ssh  *SSHTunnelConfig `json:"ssh"`
}

func (c *Connection) GetEntityPrefix() string {
	return "con"
}

func NewConnection(c ConnectionData) (*Connection, error) {
	connectionID := tools.GenerateID(tools.EntityTypesConnection)

	return &Connection{
		ID:   connectionID,
		Name: c.Name,
		Type: c.Type,
		Host: c.Host,
		Port: c.Port,
		User: c.User,
		Pass: c.Pass,
		DB:   c.DB,
	}, nil
}

func (c *Connection) GetDSN() *string {
	var dsn string

	switch c.Type {
	case ConnTypePostgres:
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable", c.User, c.Pass, c.Host, c.Port, c.DB)
	case ConnTypeMySQL:
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", c.User, c.Pass, c.Host, c.Port, c.DB)
	case ConnTypeSQLite:
		dsn = c.DB // For SQLite, DSN is the path to the database file
	}

	return &dsn
}

func StartSSHTunnel(config SSHTunnelConfig) (net.Conn, error) {
	key, err := os.ReadFile(config.PrivateKey)
	if err != nil {
		return nil, fmt.Errorf("unable to read private key: %v", err)
	}

	signer, err := ssh.ParsePrivateKeyWithPassphrase(key, []byte(config.Passphrase))
	if err != nil {
		return nil, fmt.Errorf("unable to parse private key: %v", err)
	}

	sshConfig := &ssh.ClientConfig{
		User: config.User,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // FIXME: This is insecure and should be replaced
	}

	sshConn, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", config.Host, config.Port), sshConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to establish SSH connection: %v", err)
	}

	conn, err := sshConn.Dial("tcp", fmt.Sprintf("%s:%d", config.RemoteHost, config.RemotePort))
	if err != nil {
		return nil, fmt.Errorf("failed to dial remote connection: %v", err)
	}

	return conn, nil
}
