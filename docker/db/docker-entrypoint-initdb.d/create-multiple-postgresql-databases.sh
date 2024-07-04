#!/bin/bash

set -e
set -u

function create_database() {
	local database=$1
	if psql -lqt --username "$POSTGRES_USER" | cut -d \| -f 1 | grep -qw $database; then
		echo "Database '$database' already exists"
		return
	else
	echo "Creating database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO monkeys;
EOSQL
		echo "Database '$database' created"
	fi
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		create_database $db
	done
	echo "Multiple databases created"
fi