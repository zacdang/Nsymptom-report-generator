# Symptom Report Generator - Project TODO

## Database Schema
- [x] Create symptoms table (name, long_text, display_order)
- [x] Create employees table (username, password_hash, name, role)
- [x] Create reports table (employee_id, symptom_input, markdown_content, created_at, updated_at)
- [x] Create report_templates table for storing intro paragraph and image URLs

## Authentication System
- [x] Implement employee login with username/password
- [x] Implement admin login
- [x] Add password hashing with bcrypt
- [x] Add session management
- [x] Implement logout functionality

## Admin Panel - Symptom Knowledge Base
- [x] Create admin dashboard layout
- [x] Build symptom list view with search/filter
- [x] Implement add new symptom form
- [x] Implement edit symptom form
- [x] Implement delete symptom functionality
- [x] Add display order management (drag-and-drop or number input)

## Admin Panel - Employee Management
- [x] Build employee list view
- [x] Implement add new employee form
- [x] Implement delete employee functionality
- [x] Implement reset password functionality
- [x] Add role management (admin/employee)

## Admin Panel - Reports View
- [x] Build all reports list view
- [x] Add filters by employee and date
- [x] Add view report detail functionality

## Employee Dashboard
- [x] Create employee dashboard layout
- [x] Build "Create New Report" button
- [x] Build list of employee's previous reports
- [ ] Add view/edit previous report functionality

## Report Creation
- [x] Create report creation form with text input area
- [x] Implement symptom name parsing (comma/newline separated)
- [x] Implement exact match lookup in knowledge base
- [x] Show preview of matched symptoms before generation
- [x] Generate Markdown draft with intro + symptom texts + images

## Report Editor
- [x] Build Markdown editor component
- [x] Add save draft functionality
- [ ] Add preview Markdown rendering

## PDF Export
- [x] Implement Markdown to PDF conversion with PDFKit
- [x] Ensure Chinese character support
- [x] Embed images in PDF
- [x] Add download PDF button

## Report Template
- [ ] Create default intro paragraph template
- [ ] Add placeholder images for report template
- [ ] Design report layout structure

## Testing & Polish
- [ ] Test admin CRUD operations
- [ ] Test employee report creation workflow
- [ ] Test PDF export with Chinese characters
- [ ] Test row-level access control
- [ ] Add loading states and error handling
- [ ] Add success/error toast notifications

## Deployment
- [x] Create deployment checkpoint
- [x] Write deployment guide for server setup
- [x] Create automated deployment script
- [x] Create quick start guide

## Bug Fixes
- [x] Fix symptom parsing to handle both Chinese commas (，) and English commas (,)
- [x] Improve symptom name matching to trim whitespace

## PDF Generation
- [x] Install PDFKit library (production-compatible)
- [x] Create PDF generation endpoint in backend
- [x] Add Markdown to HTML conversion
- [x] Configure font support for PDF
- [x] Add PDF download button to report editor
- [x] Add PDF download button to reports list
- [x] Fix admin routing - redirect admins to /admin instead of /employee
- [x] Fix PDF generation to work in Manus production environment

## Localization
- [x] Translate all English UI text to Chinese
- [x] Update login page to Chinese
- [x] Update admin dashboard to Chinese
- [x] Update employee dashboard to Chinese
- [x] Update all buttons and labels to Chinese
- [x] Update all error messages to Chinese
- [x] Update all success messages to Chinese
