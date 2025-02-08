# Patient CRM Project Plan

_Last Updated: 2025-02-07_

## 1. Project Overview

I am developing a high-performance, user-friendly web application that functions as a Patient CRM. My goal is to streamline patient management tasks, including communication via text and email, campaign management, analytics, detailed patient records, and appointment scheduling through a calendar view.

Key functionalities that I plan to implement include:

- **Messaging & Campaigns**:  
  - **Individual Text Messaging**: I will integrate a basic text messaging service using a free SMS API (scaling to per-text charges when needed).
  - **Bulk Messaging & Emailing**: I plan to utilize templated messages (e.g., “Hey {patient.firstName}…”) for both text and email campaigns.
  - **Analytics**: I will provide insights into campaign performance and message engagement.

- **Patient Management**:  
  - A viewable table of patients with details such as appointment status, contact info, insurance, balance, and scheduled messages.
  - An expandable sidebar for patient-specific details with dropdowns for additional information.
  - Filtering capabilities and the ability to create custom patient sublists.

- **Calendar**:  
  - A day-view calendar similar to Google Calendar’s 24-hour layout.
  - Display of scheduled appointments pulled from a MySQL database generated from OpenDental.

## 2. Architecture & Technology Stack

### 2.1. Frontend
- **Framework**: I will use [Next.js](https://nextjs.org/) for a robust, server-side rendered React application.
- **Language**: TypeScript for type safety and maintainability.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for efficient and responsive styling.
- **UI Components**: I plan to extend [shadcn](https://ui.shadcn.com/) components for a consistent, modular design.

### 2.2. Backend / API
- **Next.js API Routes**: I will handle server-side logic and lightweight API endpoints using Next.js API routes.
- **Serverless Functions**: I may utilize Vercel’s serverless functions to ensure high performance and scalability.
- **ORM / Database Client**: I intend to use [Prisma](https://www.prisma.io/) for type-safe interactions with the MySQL database.

### 2.3. Database
- **MySQL Database**:  
  - I will use MySQL as the database engine since the actual file is generated from OpenDental.
  - The schema will be modeled closely after OpenDental.
  - I will use migration tools (e.g., Prisma Migrate) for schema evolution.

### 2.4. Third-Party Integrations
- **Text Messaging**:  
  - I plan to integrate with a free SMS service (e.g., a trial of [Twilio](https://www.twilio.com/) or another cost-effective SMS API) for basic messaging functionality.
- **Bulk Emailing**:  
  - I will utilize basic SMTP handling with a Gmail server setup.
- **Analytics**:  
  - I intend to integrate lightweight chart libraries (e.g., [Chart.js](https://www.chartjs.org/) or [Recharts](https://recharts.org/)) for the message analytics dashboards.

## 3. Features & Modules

### 3.1. Navigation & Layout
- **Sidebar**:  
  - I will implement a persistent sidebar navigation to access sub-apps (Campaigns, Patient Management, Calendar, etc.).
  - Clicking on a patient will expand a sidebar with dynamic dropdowns for various data sections.

### 3.2. Campaigns Module
- **Messaging Functionality**:
  - **Single & Bulk Text Messaging**: I will implement both one-to-one messaging and bulk sending using templates.
  - **Bulk Emailing**: I will integrate SMTP-based emailing with templating for personalization.
- **Template Engine**:  
  - I plan to implement dynamic templating for personalizing messages (e.g., inserting `{patient.firstName}`).
- **Analytics Dashboard**:  
  - I will create a real-time analytics dashboard to track sent messages, including open rates and delivery statuses.

### 3.3. Patient Management Module
- **Patient Table View**:
  - I will build a dynamic, filterable table that lists all patients.
  - The table will include details such as appointment status, contact information, insurance data, balance, and upcoming/scheduled messages.
- **Detail Sidebar**:
  - I will enable clickable rows that expand to reveal detailed patient information.
  - Additional dropdown sections will provide details on appointments, messages, financial info, etc.

### 3.4. Calendar Module
- **24-Hour Day View**:
  - I plan to design a calendar view similar to Google Calendar’s daily 24-hour layout.
  - The default view will display the current day, with the ability to navigate to other days.
- **Event Integration**:
  - I will display scheduled appointments pulled from the MySQL database.
  - The UI will allow for interactive event details and editing.

## 4. Performance & Scalability Considerations

- **Next.js Optimization**:
  - I will leverage server-side rendering and static site generation where applicable.
  - I plan to use code-splitting and lazy loading for non-critical modules.
- **Efficient Data Fetching**:
  - I will utilize Next.js API routes along with caching strategies (e.g., in-memory or Redis if needed) for fast data access.
- **Responsive UI**:
  - Tailwind CSS will be used for rapid UI development, ensuring both performance and responsiveness.
  - I will extend shadcn components to provide a consistent and optimized user experience.
- **Database Query Optimization**:
  - I will employ Prisma’s query optimization techniques.
  - I will ensure proper indexing according to the requirements of the OpenDental schema.

## 5. Development Roadmap & Milestones

Below is my planned roadmap with milestones:

### Milestone 1: Project Setup & Architecture
- [x] Initialize the Next.js project with TypeScript.
- [x] Configure Tailwind CSS color palette.
- [x] Integrate shadcn components.
- [x] Set up Prisma with a local MySQL database
- [x] Generate dummy data from legitimate opendental database using a script + Faker
- [ ] Edit database as needed for localized restore and prisma generation

### Milestone 2: Core Layout & Navigation
- [ ] Develop the main layout with a sidebar navigation system.
- [ ] Implement dynamic routing for sub-app modules.

### Milestone 3: Patient Management Module
- [ ] Create the patient table view with filtering and sublist capabilities.
- [ ] Implement an expandable patient detail sidebar.

### Milestone 4: Campaigns Module
- [ ] Integrate SMS and email APIs.
- [ ] Develop templating functionality for bulk messaging.
- [ ] Build the basic analytics dashboard.

### Milestone 5: Calendar Module
- [ ] Design and implement a 24-hour day-view calendar.
- [ ] Integrate event data fetching and interactivity.

### Milestone 6: Testing & Deployment
- [ ] Write unit and integration tests (using Jest or a similar framework).
- [ ] Conduct end-to-end testing for key user flows.

## 6. Additional Considerations

- **Documentation**: I will maintain comprehensive code and user documentation.
- **Code Reviews & Collaboration**: I plan to use Git for version control.