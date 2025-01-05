## Deployment

### Local Deployment

#### Prerequisites

- Python 3.11+
- Redis
- MySQL

#### Install Dependencies

We recommend created a virtual environment before executing the following commands.

Run the following command to install the required Python packages:

```sh
pip install -r requirements.txt
```

#### Start the Application

Set the environment variable and start the application:
```sh
export ENV=prod
python app.py
```

### Docker

#### Prerequisites

- Docker
- Redis
- MySQL

#### Build Docker Image

Run the following command to build the Docker image:
```sh
docker build -t mmsweb .
```

#### Start Docker Container

Run the following command to start the Docker container, ensuring the configuration files are mounted and the environment variable is set:

```sh
docker run -d -e ENV=prod -v /path/to/conf:/app/conf mmsweb
```

## Configuration Guide

* Refer to the complete configuration files in the conf directory.
* By default, the application uses conf/dev.toml for development.
* For production, set the environment variable ENV=prod, and the application will use conf/prod.toml.
* The application supports overriding configurations from environment variables, as defined in config.py.

## External Dependencies

### SMTP

SMTP is used for registration, password reset, and web store notifications.

#### SMTP Configuration

Configure SMTP settings in the `[smtp]` section of the configuration file. Refer to the following documentation for common email providers:

- [Gmail SMTP](https://support.google.com/mail/answer/7126229?hl=en)
- [Outlook SMTP](https://support.microsoft.com/en-us/office/pop-and-imap-settings-for-outlook-997e2a41-8451-4dc1-81f9-ae6acb0c4c12)

### Gtop100

GTop100 is used for the voting feature.

#### Gtop100 Configuration

Register an account on GTop100, create a server, and configure the `site_id`. Update the `[gtop100]` section in the configuration file.

### gRPC

gRPC is an optional dependency used to enhance the experience for features like check-in and web store shopping.

#### gRPC Configuration
Implement the RPC methods defined in `services/rpc/magicms.proto` on the game server and configure the `[rpc_server]` section in the configuration file.

## API Documentation

When `osa=true` is set under `[ext_config]`, you can access the OpenAPI documentation at `/docs`.