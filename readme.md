# DaBois Discord Bot 🤖

## Features ✨

### Commands 📝
- `/ban` - Ban a user from the server.
- `/kick` - Kick a user from the server.
- `/birthday set` - Set your birthday.
- `/birthday view` - View your birthday or others' birthdays.
- `/flip` - Flip a coin.
- `/modlogs` - View moderation logs.
- `/userinfo` - Get information about a user.
- `/serverinfo` - Get information about the server.
- `/help` - List all commands.

---

## Extra Features 🛠️
- Birthday announcing .
- Moderation logging (modlogs) .
- User and server information .
- Coin flip utility .
- Ban and kick moderation tools .
- Modlogs in ```users.json```

---

## Get started 🚀

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher) 
- A Discord bot token (from the [Discord Developer Portal](https://discord.com/developers/applications)) 🔑

### Installation

1. Clone this repository or download the source code .
2. Open a terminal in the project directory .
3. Install dependencies:
    ```bash
    npm install
    ```

### Running the Bot ▶️

Start the bot with:
```bash
node index.js
```
or, if using `npm` scripts:
```bash
npm start
```

### Hosting on a Server ☁️

- For persistent hosting, consider using a VPS or a cloud platform (e.g., Heroku, AWS, DigitalOcean) 🌐.
- Use a process manager like [PM2](https://pm2.keymetrics.io/) to keep the bot running:
    ```bash
    npm install -g pm2
    pm2 start index.js --name dabois-bot
    pm2 save
    pm2 startup
    ```
- Make sure to keep your bot token secure and never share it publicly 🔒.

#### Hosting on AWS 🚀

- **EC2 Instance:**  
    1. Launch an [EC2](https://aws.amazon.com/ec2/) instance (Ubuntu or Amazon Linux recommended).
    2. SSH into your instance and install Node.js and Git.
    3. Clone your repository and install dependencies:
         ```bash
         git clone <your-repo-url>
         cd <your-project-folder>
         npm install
         ```
    4. Use PM2 (as above) to keep the bot running.
    5. Configure security groups to allow outbound connections (for Discord API).
    6. Store your bot token securely (consider using environment variables or AWS Secrets Manager).

- **Tips:**  
    - Use [AWS Lightsail](https://lightsail.aws.amazon.com/) for a simpler setup.
    - Set up automatic restarts and monitoring with PM2 or AWS tools.
    - Regularly update your instance and dependencies for security.

