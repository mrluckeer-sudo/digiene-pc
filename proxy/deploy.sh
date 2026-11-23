#!/bin/sh
# Создаёт закрытую функцию и шлюз. Ключ в аргументы не писать:
#   YC_AI_API_KEY=… YC_FOLDER_ID=… YC_SA_ID=… sh proxy/deploy.sh
set -eu
if [ -z "${YC_AI_API_KEY:-}" ] || [ -z "${YC_FOLDER_ID:-}" ] || [ -z "${YC_SA_ID:-}" ]; then
  echo "Нужны YC_AI_API_KEY, YC_FOLDER_ID и YC_SA_ID в окружении. Значения в чат не присылать." >&2
  exit 1
fi
cd "$(dirname "$0")"
yc serverless function create --name digiene-pc-ai >/dev/null 2>&1 || true
yc serverless function version create \
  --function-name digiene-pc-ai \
  --runtime nodejs22 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 30s \
  --source-path . \
  --environment "YC_AI_API_KEY=${YC_AI_API_KEY},YC_FOLDER_ID=${YC_FOLDER_ID}"
fid="$(yc serverless function get --name digiene-pc-ai --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
sed -e "s/FUNCTION_ID/${fid}/" -e "s/GATEWAY_SA_ID/${YC_SA_ID}/" openapi.yaml > /tmp/digiene-pc-ai.yaml
yc serverless api-gateway create --name digiene-pc-ai --spec=/tmp/digiene-pc-ai.yaml >/dev/null 2>&1 \
  || yc serverless api-gateway update --name digiene-pc-ai --spec=/tmp/digiene-pc-ai.yaml
rm -f /tmp/digiene-pc-ai.yaml
echo "Шлюз создан. Адрес /chat положить в секрет YC_AI_PROXY_URL репозитория digiene-pc."
echo "Функцию не открывать: yc serverless function allow-unauthenticated-invoke не вызывать."
