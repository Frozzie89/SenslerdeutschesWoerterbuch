import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(24px)' }),
      animate('380ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeAnimations],
})
export class AppComponent {
  title = 'senslerdeutsches-woerterbuch';

  getRouteData(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }
}
