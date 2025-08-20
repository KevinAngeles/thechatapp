import { StrictMode } from 'react';
import { Provider } from "react-redux"
// import * as ReactDOM from 'react-dom/client';
import { createRoot } from "react-dom/client";
import App from '@src/App';
// import App from "@/App"
import { store } from "@app/store";
// import { store } from "@/app/store";

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );

// root.render(
//   <StrictMode>
//       <Provider store={store}>
//         <App/>
//       </Provider>
//     </StrictMode>
// );

const container = document.getElementById("root")

if (container) {
  const root = createRoot(container)

  root.render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  )
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  )
}
