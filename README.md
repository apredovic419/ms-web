## Overview
The project currently lacks documentation. We plan to add detailed documentation in the coming weeks.

## Deployment

We provide a minimal deployment guide for deploying a preview version of this project using `docker-compose`.

1. Ensure you have Docker and Docker Compose installed on your system.
2. Clone the repository to your local machine.
3. Navigate to the project directory.
4. Run the following command to start the services:

    ```sh
    docker-compose up
    ```

This will build and start the necessary services defined in the `docker-compose.yml` file.

After waiting for the application to start, you can view the application by accessing `http://localhost:8000` through the browser.

For the admin panel, you can access it by visiting `http://localhost:8000` and logging. By the way, you can set `webadmin` to `1` in the `accounts` table to make the account an administrator.

**Note**: You should check the [docker-compose.yml](./docker-compose.yml) file for the main configuration environment variables. For the WEB database, a complete dataset is already provided in [`db/mysql/mmsweb.db.gz`](./db/mysql/mmsweb.db.gz), while for the GAME database, [`db/mysql/magicms.db.gz`](./db/mysql/magicms.db.gz) only contains the necessary table structures and an initial account `guest`, with the password `guest`.

## Future Updates
Stay tuned for more updates and detailed documentation.
