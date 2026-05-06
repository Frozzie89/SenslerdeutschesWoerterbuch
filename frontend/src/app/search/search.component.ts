import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  startWith,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit, OnDestroy {
  result: any = null;
  private subscriptions = new Subscription();
  searchEngineDown = false;

  private selectedTagsSubject = new BehaviorSubject<string[]>([]);
  private randomTrigger = new Subject<void>();
  private searchTerm$ = new BehaviorSubject<string>('');
  private skipNextTermEmission = false;

  searchControl = new FormControl('');

  tags: any[] = [];
  selectedTags: string[] = [];
  tagsOpen = false;

  get searchTerm(): string {
    return this.searchControl.value ?? '';
  }

  get activeTags(): string[] {
    return this.selectedTags;
  }

  constructor(readonly searchService: SearchService) {}

  ngOnInit() {
    this.subscriptions.add(
      this.searchService.getTags().subscribe({
        next: (tags) => (this.tags = tags),
        error: () => (this.tags = []),
      }),
    );

    this.subscriptions.add(
      this.searchService.checkSearchEngineStatus().subscribe({
        next: (available) => (this.searchEngineDown = !available),
        error: () => (this.searchEngineDown = true),
      }),
    );

    if (this.searchService.lastSearchTerm) {
      this.searchControl.setValue(this.searchService.lastSearchTerm);
    }

    this.subscriptions.add(
      this.searchControl.valueChanges
        .pipe(startWith(this.searchControl.value), debounceTime(300), distinctUntilChanged())
        .subscribe((term) => this.searchTerm$.next(term ?? '')),
    );

    const inputSearch$ = combineLatest([this.searchTerm$, this.selectedTagsSubject]).pipe(
      filter(() => {
        if (this.skipNextTermEmission) {
          this.skipNextTermEmission = false;
          return false;
        }
        return true;
      }),
      map(([term, tags]) => ({ term: term ?? '', tags, random: false })),
    );

    const randomSearch$ = this.randomTrigger.pipe(
      map(() => ({ term: '', tags: this.selectedTagsSubject.value, random: true })),
    );

    this.subscriptions.add(
      merge(inputSearch$, randomSearch$)
        .pipe(
          switchMap((params) => {
            this.searchService.lastSearchTerm = params.term;
            return this.searchService.search(params.term, params.tags, params.random).pipe(
              catchError((err) => of({ hits: { total: 0, hits: [] }, error: err })),
            );
          }),
        )
        .subscribe({
          next: (res) => (this.result = res),
          error: (err) => (this.result = { hits: { total: 0, hits: [] }, error: err }),
        }),
    );
  }

  randomWordSearch() {
    this.searchControl.setValue('', { emitEvent: false });
    this.skipNextTermEmission = true;
    this.searchTerm$.next('');
    this.randomTrigger.next();
  }

  toggleTags() {
    this.tagsOpen = !this.tagsOpen;
  }

  toggleTag(tag: any) {
    const name: string = tag?.name ?? tag;
    if (this.selectedTags.includes(name)) {
      this.selectedTags = this.selectedTags.filter((t) => t !== name);
    } else {
      this.selectedTags = [...this.selectedTags, name];
    }
    this.selectedTagsSubject.next(this.selectedTags);
  }

  removeTag(tagName: string) {
    this.selectedTags = this.selectedTags.filter((t) => t !== tagName);
    this.selectedTagsSubject.next(this.selectedTags);
  }

  clearTags() {
    this.selectedTags = [];
    this.selectedTagsSubject.next([]);
  }

  isTagSelected(tag: any): boolean {
    return this.selectedTags.includes(tag?.name ?? tag);
  }

  tagDisplayName(tag: any): string {
    return tag?.display_name || tag?.name || tag;
  }

  highlightMatch(text: string, q: string): string {
    if (!q) return this.escHtml(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return this.escHtml(text);
    return (
      this.escHtml(text.slice(0, idx)) +
      '<mark>' +
      this.escHtml(text.slice(idx, idx + q.length)) +
      '</mark>' +
      this.escHtml(text.slice(idx + q.length))
    );
  }

  greetingDate(): string {
    const days = ['Sunntig', 'Määntig', 'Ziischtig', 'Mittwoch', 'Dunschtig', 'Friitig', 'Samschtig'];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const d = new Date();
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}. ${months[d.getMonth()]}`;
  }

  get resultCount(): number {
    return this.result?.hits?.hits?.length ?? 0;
  }

  private escHtml(s: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, (c) => map[c] ?? c);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
