import { Component } from '@angular/core';
import { NavigationShellComponent } from './layout/navigation-shell/navigation-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavigationShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
