import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { FormatDescriptionPipe } from '../pipes/format-description.pipe';

@Component({
  selector: 'app-word-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormatDescriptionPipe],
  templateUrl: './word-page.component.html',
  styleUrl: './word-page.component.scss',
})
export class WordPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  readonly apiUrl = environment.apiUrl + '/dictionary/word/';

  wordEntry: any = null;
  loading = true;
  error = false;
  wordChars: { char: string; delay: string }[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.loadWord(id);
    });
  }

  private loadWord(id: string): void {
    this.loading = true;
    this.error = false;
    this.wordEntry = null;
    this.wordChars = [];
    this.http.get<any>(this.apiUrl + `${id}/`).subscribe({
      next: (data) => {
        this.wordEntry = data;
        this.wordChars = [...(data.term ?? '')].map((ch, i) => ({
          char: ch === ' ' ? ' ' : ch,
          delay: `${i * 22}ms`,
        }));
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  copyWordToClipboard() {
    if (!this.wordEntry) return;
    const text = this.wordEntry.term ?? '';
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  shareWord() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  }
}
