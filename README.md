# AARC Directory - Attendance App

An Angular-based attendance tracking application for amateur radio club meetings.

## Features

- Member attendance tracking
- Call sign and name display
- Timestamp recording
- Download attendance logs as JSON

## Deployment to GitHub Pages

### Automated Deployment

The application is configured to deploy to GitHub Pages automatically using `angular-cli-ghpages`.

#### Prerequisites

- Node.js and npm installed
- Angular CLI installed (`npm install -g @angular/cli`)
- Git repository configured with GitHub remote

#### Deployment Steps

1. **Navigate to the Angular application directory:**
   ```bash
   cd attendance-app
   ```

2. **Build the application for production:**
   ```bash
   ng build --configuration production --base-href /ad/
   ```

   Note: The base-href must match your repository name (`/ad/` for this repository).

3. **Deploy to GitHub Pages:**
   ```bash
   npx angular-cli-ghpages --dir=dist/attendance-app/browser
   ```

4. **Access your deployed application:**
   - The app will be available at: `https://payne.github.io/ad/`
   - GitHub Pages may take a few minutes to update after deployment

### Manual Deployment (Alternative Method)

If you prefer to deploy manually without using `angular-cli-ghpages`:

1. **Build the application:**
   ```bash
   cd attendance-app
   ng build --configuration production --base-href /ad/
   ```

2. **Copy the build output:**
   ```bash
   cp -r dist/attendance-app/browser/* ../docs/
   ```

   Or create a `gh-pages` branch manually:
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r dist/attendance-app/browser/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   git checkout main
   ```

3. **Configure GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Select the `gh-pages` branch as the source
   - Save the configuration

## Development

### Local Development Server

Run the development server:
```bash
cd attendance-app
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Project Structure

- `attendance-app/` - Main Angular application
- `photos/` - Member photos
- `roster.json` - Member roster data

## Git Workflow

### Committing Changes

After making changes:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Deploying After Changes

After pushing changes to main, redeploy:
```bash
cd attendance-app
ng build --configuration production --base-href /ad/
npx angular-cli-ghpages --dir=dist/attendance-app/browser
```

## Troubleshooting

### Build Warnings

- **RouterOutlet warning**: This can be ignored if routing is not being used
- **Bundle size exceeded**: Consider lazy loading modules or optimizing imports if performance is affected

### Deployment Issues

- Ensure GitHub Pages is enabled in repository settings
- Check that the base-href matches your repository name
- Verify the gh-pages branch exists and contains the built files
- Clear browser cache if changes don't appear immediately
