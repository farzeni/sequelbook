export namespace books {
	
	export class Cell {
	    id: string;
	    content: string;
	    type: string;
	
	    static createFrom(source: any = {}) {
	        return new Cell(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.content = source["content"];
	        this.type = source["type"];
	    }
	}
	export class Book {
	    id: string;
	    title: string;
	    cells: Cell[];
	    // Go type: time
	    create_date: any;
	    // Go type: time
	    update_date: any;
	
	    static createFrom(source: any = {}) {
	        return new Book(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.cells = this.convertValues(source["cells"], Cell);
	        this.create_date = this.convertValues(source["create_date"], null);
	        this.update_date = this.convertValues(source["update_date"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BookData {
	    title: string;
	    cells: Cell[];
	
	    static createFrom(source: any = {}) {
	        return new BookData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.cells = this.convertValues(source["cells"], Cell);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace connections {
	
	export class SSHTunnelConfig {
	    host: string;
	    port: number;
	    user: string;
	    private_key: string;
	    passphrase: string;
	    remote_host: string;
	    remote_port: number;
	
	    static createFrom(source: any = {}) {
	        return new SSHTunnelConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.private_key = source["private_key"];
	        this.passphrase = source["passphrase"];
	        this.remote_host = source["remote_host"];
	        this.remote_port = source["remote_port"];
	    }
	}
	export class Connection {
	    id: string;
	    name: string;
	    type: string;
	    host: string;
	    port: number;
	    user: string;
	    pass: string;
	    db: string;
	    ssh?: SSHTunnelConfig;
	
	    static createFrom(source: any = {}) {
	        return new Connection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.pass = source["pass"];
	        this.db = source["db"];
	        this.ssh = this.convertValues(source["ssh"], SSHTunnelConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ConnectionData {
	    name: string;
	    type: string;
	    host: string;
	    port: number;
	    user: string;
	    pass: string;
	    db: string;
	    ssh?: SSHTunnelConfig;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.pass = source["pass"];
	        this.db = source["db"];
	        this.ssh = this.convertValues(source["ssh"], SSHTunnelConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace core {
	
	export class Settings {
	    version: string;
	    language?: string;
	    focus_new_tabs: boolean;
	    confirm_file_deletion: boolean;
	    deleted_files: string;
	    theme: string;
	    accent_color: string;
	    zoom_level: number;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.language = source["language"];
	        this.focus_new_tabs = source["focus_new_tabs"];
	        this.confirm_file_deletion = source["confirm_file_deletion"];
	        this.deleted_files = source["deleted_files"];
	        this.theme = source["theme"];
	        this.accent_color = source["accent_color"];
	        this.zoom_level = source["zoom_level"];
	    }
	}

}

export namespace runners {
	
	export class ColumnDef {
	    column_name: string;
	    data_type: string;
	    is_nullable: boolean;
	    column_default?: string;
	    is_primary_key: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ColumnDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.column_name = source["column_name"];
	        this.data_type = source["data_type"];
	        this.is_nullable = source["is_nullable"];
	        this.column_default = source["column_default"];
	        this.is_primary_key = source["is_primary_key"];
	    }
	}
	export class ColumnResult {
	    columns: ColumnDef[];
	
	    static createFrom(source: any = {}) {
	        return new ColumnResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.columns = this.convertValues(source["columns"], ColumnDef);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QueryResult {
	    query: string;
	    columns: string[];
	    json: string;
	    affected_rows: number;
	    type: string;
	
	    static createFrom(source: any = {}) {
	        return new QueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.columns = source["columns"];
	        this.json = source["json"];
	        this.affected_rows = source["affected_rows"];
	        this.type = source["type"];
	    }
	}
	export class TableDef {
	    schema: string;
	    table_name: string;
	    table_type: string;
	
	    static createFrom(source: any = {}) {
	        return new TableDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.schema = source["schema"];
	        this.table_name = source["table_name"];
	        this.table_type = source["table_type"];
	    }
	}
	export class TableResult {
	    tables: TableDef[];
	
	    static createFrom(source: any = {}) {
	        return new TableResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tables = this.convertValues(source["tables"], TableDef);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

