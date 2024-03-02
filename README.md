# ![RealWorld Example App](logo.png)

> ### Janilla codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.


### [Demo](https://conduit.janilla.com/)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/gothinkster/realworld)&nbsp;&nbsp;&nbsp;&nbsp;[Janilla](https://github.com/diego-schivo/janilla)


This codebase was created to demonstrate a fully fledged fullstack application built with **Janilla** including CRUD operations, authentication, routing, pagination, and more.

We've gone to great lengths to adhere to the **Janilla** community styleguides & best practices.

For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.


# How it works

The codebase is organized as this:

1. `backend` is the web application implementing the [Backend Specs](https://realworld-docs.netlify.app/docs/specs/backend-specs/introduction)
2. `frontend` is the web application implementing the [Frontend Specs](https://realworld-docs.netlify.app/docs/specs/frontend-specs/templates)
3. `fullstack` is a single web app running both backend and frontend
4. `testing` is a web app running end-to-end tests

# Getting started

You can view a live demo over at <https://conduit.janilla.com/>.

### Run the project locally

If you are unfamiliar with the terminal, you can set up the project in an IDE (section below).

Make sure you have Java SE Platform (JDK 21) and [Apache Maven](https://maven.apache.org/install.html) installed.

From the project root, run the following command to run the fullstack application:

```shell
mvn compile exec:java -pl fullstack
```

Then open a browser and navigate to `http://localhost:8080/` (APIs use the same port 8080).

> **_Note:_**  I suggest flagging the Disable Cache checkbox in the Network tab of the Web Developer Tools.

Alternatively, you can run the backend and frontend applications separately:

```shell
mvn compile exec:java -pl backend
```

```shell
mvn compile exec:java -pl frontend
```

Then navigate to `http://localhost:8080/` (the API port is 8081).  

If you want to change the API URL, simply edit the `configuration.properties` files located in the source package of each module.

### Set up the project in an IDE

I use [Eclipse IDE](https://eclipseide.org/) for development:

1. download the [Eclipse Installer](https://www.eclipse.org/downloads/packages/installer)
2. install the package for Enterprise Java and Web Developers with JRE 21.0.1
3. launch the IDE and choose Import projects from Git (with smart import)
4. select GitHub as the repository source, then search for `janilla-conduit fork:true` and complete the wizard
5. select a project (eg: `janilla-conduit-fullstack`) and launch Debug as Java Application
6. open a browser and navigate to `http://localhost:8080/`

### Testing

Run the following command:

```shell
mvn compile exec:java -pl testing
```

Then navigate to `http://localhost:8080/`, select some tests and click Run, then wait for test color to change to either green (test succeeded) or red (test failed).
