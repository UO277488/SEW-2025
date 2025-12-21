<?php
class Configuracion {
    private $mysqli;
    private $dbName;

    public function __construct($host='localhost', $user='root', $pass='', $db='user_db'){
        $this->dbName = $db;
        $this->mysqli = new mysqli($host, $user, $pass, $db);
        if ($this->mysqli->connect_errno) {
            // Mensaje más útil para el desarrollador/usuario local
            throw new Exception('MySQL connect error: ' . $this->mysqli->connect_error . ". Comprueba que has importado 'php/database.sql' (crea la base 'user_db') y ejecutado 'php/create_db_user.sql' para crear el usuario DBUSER2025.");
        }
        $this->mysqli->set_charset('utf8mb4');
    }

    // Reiniciar base de datos: vaciar todas las tablas
    public function reiniciarBaseDatos(){
        $tables = $this->getTables();
        if (empty($tables)) return true;
        $this->mysqli->query('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($tables as $t){
            $sql = "TRUNCATE TABLE `" . $this->mysqli->real_escape_string($t) . "`";
            $this->mysqli->query($sql);
        }
        $this->mysqli->query('SET FOREIGN_KEY_CHECKS = 1');
        return true;
    }

    // Eliminar base de datos completa (DROP)
    public function eliminarBaseDatos(){
        $db = $this->dbName;
        $this->mysqli->close();
        $link = new mysqli('localhost', 'root', '');
        if ($link->connect_errno) throw new Exception('Connect: ' . $link->connect_error);
        $res = $link->query('DROP DATABASE IF EXISTS `'. $link->real_escape_string($db) . '`');
        $link->close();
        return $res;
    }

    // Exportar datos de tablas relevantes a CSV (all tables by default)
    public function exportarCSV($tables = []){
        if (empty($tables)) $tables = $this->getTables();
        $zipname = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'export_' . time() . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($zipname, ZipArchive::CREATE)!==TRUE) throw new Exception('No se pudo crear zip');
        foreach ($tables as $t){
            $esc = $this->mysqli->real_escape_string($t);
            $res = $this->mysqli->query("SELECT * FROM `{$esc}`");
            $csv = '';
            if ($res){
                $fields = [];
                while ($field = $res->fetch_field()) $fields[] = $field->name;
                $csv .= implode(',', array_map([$this,'escapeCsv'],$fields)) . "\n";
                while ($row = $res->fetch_assoc()){
                    $line = [];
                    foreach ($fields as $f) $line[] = $this->escapeCsv($row[$f]);
                    $csv .= implode(',', $line) . "\n";
                }
                $res->free();
            }
            $zip->addFromString($t . '.csv', $csv);
        }
        $zip->close();
        return $zipname;
    }

    private function escapeCsv($value){
        if ($value === null) return '';
        $value = str_replace('"', '""', $value);
        return '"' . $value . '"';
    }

    private function getTables(){
        $list = [];
        $res = $this->mysqli->query('SHOW TABLES');
        if (!$res) return $list;
        while ($row = $res->fetch_array()) $list[] = $row[0];
        $res->free();
        return $list;
    }

    // Cerrar conexión
    public function close(){
        $this->mysqli->close();
    }

    // ---- Utilidades estáticas para crear BD / usuario desde la UI
    public static function ejecutarScriptComoRoot($sqlFile){
        $path = realpath($sqlFile);
        if (!$path || strpos($path, realpath(__DIR__)) !== 0) {
            throw new Exception('Archivo SQL no encontrado o fuera del directorio permitido.');
        }
        $sql = file_get_contents($path);
        if ($sql === false) throw new Exception('No se pudo leer el archivo SQL.');
        $link = new mysqli('localhost', 'root', '');
        if ($link->connect_errno) throw new Exception('No se pudo conectar como root: ' . $link->connect_error);
        // multi_query para ejecutar scripts con varios statements
        if (!$link->multi_query($sql)) {
            $err = $link->error;
            $link->close();
            throw new Exception('Error ejecutando script SQL: ' . $err);
        }
        // Vaciar todos los resultados pendientes
        do {
            if ($res = $link->store_result()) { $res->free(); }
        } while ($link->more_results() && $link->next_result());
        $link->close();
        return true;
    }

    public static function crearBaseDesdeSql($sqlFile){
        return self::ejecutarScriptComoRoot($sqlFile);
    }

    public static function crearUsuarioDesdeSql($sqlFile){
        return self::ejecutarScriptComoRoot($sqlFile);
    }
}

