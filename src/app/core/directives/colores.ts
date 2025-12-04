import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[appColores]'
})
export class Colores {

  @Input('appColores') color: string[] = [];

  @HostBinding('style.color') textColor: string = '';
  @HostBinding('style.background') backgroundColor: string = '';

  ngOnChanges() {
    this.textColor = this.color[0];
    this.backgroundColor = this.color[1];
  }

}
