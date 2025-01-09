# SequelBook

SequelBook is an open-source desktop application designed to organize and execute SQL queries efficiently. It combines the functionality of a query editor with the organization of a notebook, offering a streamlined way to work with databases.

![Sequelbook](https://github.com/farzeni/sequelbook/blob/master/assets/screenshot.png?raw=true)

## Features

### Core Capabilities
- **Multi-Database Support**: Connect seamlessly to PostgreSQL, MySQL, and SQLite.
- **Notebook-Style Organization**: Structure your queries into "books" containing chapters and sections for enhanced clarity and accessibility.
- **Markdown Integration**: Add Markdown notes alongside SQL code to provide additional context and documentation.
- **Integrated SQL Editor**: Leverage CodeMirror-powered syntax highlighting and intuitive editing capabilities.
- **Query Execution**: Run SQL queries directly within the app and view results instantly beneath the editor.
- **SSH Tunneling**: Secure database connections using SSH tunnels for safe and reliable remote access.
- **Export & Import**: Save, share, and back up your query books easily.

### Benefits
- **Efficiency**: Keep all your queries and related notes in one place.
- **Flexibility**: Switch between databases effortlessly.
- **Collaboration**: Share query books with teammates for collaborative workflows.
- **Documentation**: Combine notes and queries for self-contained, well-documented database projects.

## Technical Overview

SequelBook is built using:
- **Desktop app framework**: Wails (Golang)
- **Frontend**: React

### Version
Current version: **0.2.0** (Work in Progress). This version is under initial development and not yet stable.

## Getting Started

### Installation
To install SequelBook, follow these steps:
1. Download the latest release from [GitHub](https://github.com/farzeni/sequelbook/releases).
2. Extract the package and run the executable for your operating system.
3. Enjoy using SequelBook!

### Features
1. Create a new book to organize your queries.
2. Add chapters and sections for different parts of your workflow.
3. Write your queries using the integrated editor and execute them to view results.
4. Add Markdown notes to provide context for your queries.
5. Export your book for backup or sharing.
6. Navigate your database connections.

## Development
In order to contribute to SequelBook, you can set up a development environment by following these steps:

Install Wails on your machine by following the instructions [here](https://wails.io/docs/gettingstarted/installation).

Clone the repository:
```bash
git clone https://github.com/farzeni/sequelbook/
```

Navigate to the project directory:
```bash
cd sequelbook
```

Install the frontend dependencies:
```bash
cd frontend 
npm install
```

Run Wails in development mode:
```bash
wails dev
```

## Contributing
SequelBook is open source, and contributions are welcome! To contribute:

1. Fork the repository on GitHub.
2. Create a feature branch for your changes.
3. Submit a pull request with a detailed explanation of your additions or fixes.

## Roadmap
Planned features include:
- Support for LLMs to assist with query suggestions, optimization, and contextual documentation generation.
- Advanced visualization tools for query results.
- Improved performance and stability.

## Support
For questions or issues, open an issue on [GitHub](https://github.com/farzeni/sequelbook/issues).

## License

SequelBook is licensed under the MIT License. You are free to use, modify, and distribute this software in accordance with the license terms.



