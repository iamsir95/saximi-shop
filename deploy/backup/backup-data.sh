#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/tmp/saximi-backups}"
DATA_DIR="${DATA_DIR:-/var/lib/docker/volumes/saximi-shop_saximi_backend_data/_data}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/saximi-data-$STAMP.tar.gz"

: "${S3_ENDPOINT:?Missing S3_ENDPOINT}"
: "${S3_BUCKET:?Missing S3_BUCKET}"
: "${S3_ACCESS_KEY_ID:?Missing S3_ACCESS_KEY_ID}"
: "${S3_SECRET_ACCESS_KEY:?Missing S3_SECRET_ACCESS_KEY}"

mkdir -p "$BACKUP_DIR"
tar -czf "$ARCHIVE" -C "$DATA_DIR" .

AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
aws --endpoint-url "$S3_ENDPOINT" s3 cp "$ARCHIVE" "s3://$S3_BUCKET/data/$(basename "$ARCHIVE")"

find "$BACKUP_DIR" -name 'saximi-data-*.tar.gz' -mtime +7 -delete
echo "Backup uploaded: s3://$S3_BUCKET/data/$(basename "$ARCHIVE")"
