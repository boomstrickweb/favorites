# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Database Setup (Recommended: SQL Editor)

If you encounter permission errors with the CLI, the most reliable method is using the Supabase Dashboard directly:

1.  Open your [Supabase Dashboard](https://supabase.com/dashboard/project/uxbdhjflzjmtsgdlaadk/sql/new).
2.  Copy the entire contents of `supabase/migrations/20260525210000_create_profiles_table.sql`.
3.  Paste it into the **SQL Editor** and click **Run**.

### Database Setup (Alternative: CLI)

If you have the necessary account privileges, you can use the Supabase CLI:

1.  **Login to Supabase**:
    ```bash
    npx supabase login
    ```
2.  **Link your project**:
    ```bash
    npx supabase link --project-ref uxbdhjflzjmtsgdlaadk
    ```
3.  **Push migrations**:
    ```bash
    npx supabase db push
    ```

### Verification
You can verify the setup by running:
```bash
node scripts/check-db.mjs
```

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
