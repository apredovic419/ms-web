mysqladmin -uroot -p${MYSQL_ROOT_PASSWORD} create magicms
mysqladmin -uroot -p${MYSQL_ROOT_PASSWORD} create mmsweb
gunzip -k /tmp/magicms.db.gz
gunzip -k /tmp/mmsweb.db.gz
mysql -uroot -p${MYSQL_ROOT_PASSWORD} mmsweb < /tmp/mmsweb.db
mysql -uroot -p${MYSQL_ROOT_PASSWORD} magicms < /tmp/magicms.db
rm -rf /tmp/mmsweb.db /tmp/magicms.db
exit 0