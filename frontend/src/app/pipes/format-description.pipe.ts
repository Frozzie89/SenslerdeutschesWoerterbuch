import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatDescription',
  standalone: true,
})
export class FormatDescriptionPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    let s = this.escHtml(value);

    // Leading grammar marker: (v.): or (f, -e): etc.
    s = s.replace(/^\(([^)]+)\):\s*/, '<span class="gram">($1):</span> ');

    // Numbered sense markers @1@, @2@, …
    s = s.replace(/@(\d+)@/g, '<span class="sense">$1</span>');

    // SYN marker
    s = s.replace(/\/\/SYN\/\//g, '<span class="syn">Syn.</span>');

    // References like (sds 4,12: …) or (wh 88)
    s = s.replace(/\(([^()]*?(?:sds|wh|Anhang)[^()]*?)\)/g, '<span class="ref">($1)</span>');

    // ⟨Schwyy. style italic notes
    s = s.replace(/⟨([^.]+)\./g, '<em>⟨$1.</em>');

    return this.sanitizer.bypassSecurityTrustHtml(s);
  }

  private escHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return map[c] ?? c;
    });
  }
}
