# The Chat App

The Chat App is a monorepo that contains three distinct projects, each serving a specific purpose in building a modern chat application. This monorepo is managed using [Nx](https://nx.dev/), which provides a powerful toolset for managing multiple projects in a single repository.

---

## Projects in the Monorepo

### 1. **express-passport-login**
This project is a Node.js application using Express and Passport.js to handle user authentication. It provides APIs for user login, registration, and session management, leveraging JWT for secure authentication.

- **Purpose**: Backend authentication service for the chat application.
- **Key Features**:
  - User login and registration.
  - JWT-based authentication.
  - Session management with `express-session`.

---

### 2. **redux-vite-apollo-chat**
This project is a frontend application built with React, Redux, and Apollo Client. It serves as the user interface for the chat application, allowing users to send and receive messages in real-time.

- **Purpose**: Frontend for the chat application.
- **Key Features**:
  - Real-time messaging.
  - State management with Redux.
  - GraphQL integration with Apollo Client.

---

### 3. **chat-express-graphql-ws**
This project is a Node.js application using Express, GraphQL, and WebSocket. It provides the backend for real-time messaging, handling GraphQL queries, mutations, and subscriptions.

- **Purpose**: Backend for real-time messaging.
- **Key Features**:
  - GraphQL API for chat messages.
  - WebSocket server for real-time communication.
  - Integration with Apollo Server.

---

## Monorepo Purpose
The monorepo is designed to streamline the development and management of the chat application by housing all related projects in a single repository. Using Nx, developers can efficiently build, serve, and test individual projects or the entire application.

---

## Available Commands

### Serve Projects Individually
- **Serve express-passport-login**:
  ```
  npx nx serve express-passport-login
  ```
- **Serve redux-vite-apollo-chat**:
  ```
  npx nx serve redux-vite-apollo-chat
  ```
- **Serve chat-express-graphql-ws**:
  ```
  npx nx serve chat-express-graphql-ws
  ```

### Build Projects Individually
- **Build express-passport-login**:
  ```
  npx nx build express-passport-login
  ```
- **Build redux-vite-apollo-chat**:
  ```
  npx nx build redux-vite-apollo-chat
  ```
- **Build chat-express-graphql-ws**:
  ```
  npx nx serve chat-express-graphql-ws
  ```
  
### Serve All Projects at Once
- **To serve all projects simultaneously**:
  ```
  npx nx run-many --target=serve --all
  ```

### Build All Projects at Once
- **To build all projects simultaneously**:
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

3. Serve or build the projects using the commands listed above.

## Author
This project was created and maintained by [**Kevin Angeles**](https://www.kevinangeles.com/).

Feel free to reach out for questions or contributions!