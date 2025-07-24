import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faFacebook,
  faXTwitter,
  faYoutube,
  faInstagram
} from '@fortawesome/free-brands-svg-icons';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
  imports:[FontAwesomeModule]
})
export class FooterComponent {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faFacebook,
      faXTwitter,
      faYoutube,
      faInstagram
    );
  }
}