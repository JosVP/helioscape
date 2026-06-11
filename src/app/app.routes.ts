import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/title-screen/title-screen.component').then(
        (m) => m.TitleScreenComponent,
      ),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./features/game-shell/game-shell.component').then(
        (m) => m.GameShellComponent,
      ),
  },
];
