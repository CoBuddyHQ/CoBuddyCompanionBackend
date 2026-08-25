#!/bin/sh
# ==============================================================================
# CoBuddy Companion Backend — Production Automated PostgreSQL Backup Script
#
# Generates timestamped, compressed SQL backups with retention pruning.
#
# Usage:
#   ./scripts/backup-db.sh
# Cron (Daily at 02:00 UTC):
#   0 2 * * * /path/to/cobuddy-companion-backend/scripts/backup-db.sh >> /var/log/cobuddy-backup.log 2>&1
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="companion_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

echo "====================================================="
echo " [$(date +"%Y-%m-%d %H:%M:%S")] Starting Companion DB Backup..."
echo " Target: ${BACKUP_DIR}/${FILENAME}"
echo "====================================================="

# Execute pg_dump inside Docker container and pipe through gzip
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-cobuddy}" "${POSTGRES_DB:-cobuddy_companion_db}" | gzip > "${BACKUP_DIR}/${FILENAME}"

# Verify file existence and non-zero size
if [ -s "${BACKUP_DIR}/${FILENAME}" ]; then
  FILESIZE=$(ls -lh "${BACKUP_DIR}/${FILENAME}" | awk '{print $5}')
  echo "✓ Backup completed successfully: ${FILENAME} (${FILESIZE})"
else
  echo "✗ Backup failed: file is empty or missing."
  exit 1
fi

# Prune backups older than retention window
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "companion_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "✓ Retention policy applied."
echo "====================================================="
