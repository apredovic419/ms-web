FROM python:3.11.10-alpine AS be-build
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories && \
    apk update && apk add --no-cache gcc alpine-sdk libffi-dev musl-dev libxslt-dev libxml2 cython tzdata jpeg-dev openjpeg-dev zlib-dev && \
    pip config set global.index-url https://mirrors.aliyun.com/pypi/simple && \
    pip install --upgrade pip
COPY be/requirements.txt /requirements.txt
RUN pip install --timeout 30 --user --no-cache-dir --no-warn-script-location -r requirements.txt


FROM node:20.18-alpine AS fe-build
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install -g npm@latest
WORKDIR /app
COPY fe/app/package*.json ./
RUN npm install
COPY fe/app .
RUN npm run build


FROM python:3.11.10-alpine
ENV LOCAL_PKG="/root/.local"
COPY --from=be-build ${LOCAL_PKG} ${LOCAL_PKG}
COPY --from=be-build /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache libxslt-dev jpeg-dev openjpeg-dev
RUN ln -sf ${LOCAL_PKG}/bin/* /usr/local/bin/ && echo "Asia/Shanghai" > /etc/timezone
WORKDIR /app
COPY be .
COPY --from=fe-build /app/build/static /app/static
COPY --from=fe-build /app/build /app/templates
EXPOSE 8000
CMD ["python", "app.py"]
