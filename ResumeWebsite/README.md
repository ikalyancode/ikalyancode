# Interactive Resume Website

This is a modern, interactive resume website built with React, TypeScript, and Vite, styled with Tailwind CSS. It features several animations and visual effects, including a physics-based text animation and a WebGL fluid cursor effect.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Local Development Setup

Follow these steps to get the application running on your local machine.

### 1. Install Dependencies

Navigate to the project's root directory in your terminal and run the following command to install all the necessary packages defined in `package.json`:

```bash
npm install
```
This will create a `node_modules` directory with all the required libraries.

### 2. Run the Development Server

Once the dependencies are installed, you can start the Vite development server:

```bash
npm run dev
```

This command will compile the application and start a local server, typically at `http://localhost:5173`. Vite will print the exact address in your terminal.

Open your web browser and navigate to the provided URL to see the application running. The server supports Hot Module Replacement (HMR), so any changes you make to the source code will be reflected in the browser instantly without a full page reload.

## Building for Production

To create an optimized production build of the application, run:

```bash
npm run build
```

This will create a `dist` directory containing the static files (HTML, CSS, JS) for your application. You can then deploy this directory to any static site hosting service.

## Previewing the Production Build

After building the project, you can preview the production version locally:

```bash
npm run preview
```

This will start a local server to serve the files from the `dist` directory.
