// app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withHashLocation(),         // for GitHub Pages: #/sessions/...
      withComponentInputBinding() // <-- needed for input() route binding
    ),
    provideHttpClient(withFetch()),
  ],
};
