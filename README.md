# The Chat App

The Chat App is a monorepo containing the backend and frontend code for a modern chat application. This monorepo is managed using [Nx](https://nx.dev/), which provides a powerful toolset for managing multiple projects in a single repository.

---

## Code Structure in the Monorepo

### 1. **Backend: express-passport-graphql-chat**
This is the backend service for the chat application, built with Node.js, Express, Passport.js, GraphQL, and WebSocket. It handles user authentication, GraphQL queries, mutations, subscriptions, and real-time messaging.

- **Purpose**: Backend service for authentication and real-time messaging.
- **Key Features**:
  - User login and registration.
  - JWT-based authentication.
  - Session management with `express-session`.
  - GraphQL API for chat messages.
  - WebSocket server for real-time communication.
  - Integration with Apollo Server.

---

### 2. **Frontend: redux-vite-apollo-chat**
This is the frontend application for the chat app, built with React, Redux, and Apollo Client. It provides the user interface for sending and receiving messages in real-time.

- **Purpose**: Frontend for the chat application.
- **Key Features**:
  - Real-time messaging.
  - State management with Redux.
  - GraphQL integration with Apollo Client.

---

## Monorepo Purpose
The monorepo is designed to streamline the development and management of the chat application by housing both the backend and frontend code in a single repository. Using Nx, developers can efficiently build, serve, and test individual parts of the application or the entire system.

---

## MongoDB Setup
The backend requires a MongoDB database to store user and chat data. You can quickly set up a MongoDB instance using Docker.

Run the following command to start a MongoDB container:
```
docker run -d -p 27017:27017 -v C:/mydirectory/data:/data --rm mongodb/mongodb-community-server
```

This command will:
- Start a MongoDB container in detached mode.
- Map port `27017` on your local machine to the MongoDB container.
- Mount the local directory `C:/mydirectory/data` to the container's `/data` directory for persistent storage (you can replace `C:/mydirectory/data` with a different directory of your choice). 
- Automatically remove the container when stopped.

---

## Available Commands

### Serve Projects Individually
- **Serve the backend**:
  ```
  npx nx serve express-passport-graphql-chat
  ```
- **Serve the frontend**:
  ```
  npx nx serve redux-vite-apollo-chat
  ```

### Build Projects Individually
- **Build the backend**:
  ```
  npx nx build express-passport-graphql-chat
  ```
- **Build the frontend**:
  ```
  npx nx build redux-vite-apollo-chat
  ```

### Serve All Projects at Once
- **To serve both the backend and frontend simultaneously**:
  ```
  npx nx run-many --target=serve --all
  ```

### Build All Projects at Once
- **To build both the backend and frontend simultaneously**:
  ```
  npx nx run-many --target=build --all
  ```

## Getting Started
1. Clone the repository:
  ```
  git clone https://github.com/KevinAngeles/thechatapp
  cd thechatapp
  ```

2. Install dependencies:
  ```
  npm install
  ```

3. Start a MongoDB server

4. Create a `.env` file inside `apps/express-passport-graphql-chat`, `apps/express-passport-graphql-chat-e2e` and `apps/redux-vite-apollo-chat` using the variables provided in their respective `.env.backup` files.

5. Serve or build the projects using the commands listed above.

## Author
This project was created and maintained by [**Kevin Angeles**](https://www.kevinangeles.com/).

Feel free to reach out for questions or contributions!