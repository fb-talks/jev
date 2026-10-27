# Angular Signals: il trucco che rende la tua app 10 volte più veloce

Se lavori con Angular da qualche anno, ti sarà capitato di passare un pomeriggio intero a capire perché un componente si aggiorna quando non dovrebbe, o perché non si aggiorna quando dovrebbe. A me è successo più volte di quanto mi piaccia ammettere.

Con i **signal** questo problema, in buona parte, sparisce. In questo articolo vediamo cosa sono, come si usano e perché secondo me sono la novità più importante del framework degli ultimi anni.

## Cos'è un signal

Un signal è un contenitore di un valore che **avvisa chi lo sta usando quando cambia**. Niente di più, niente di meno.

```ts
import { signal, computed } from '@angular/core';

const prezzo = signal(100);
const quantita = signal(2);

const totale = computed(() => prezzo() * quantita());

console.log(totale()); // 200

quantita.set(3);
console.log(totale()); // 300
```

Per leggere il valore chiami il signal come una funzione, per cambiarlo usi `set` o `update`. Il `computed` si ricalcola da solo, e solo quando cambia uno dei signal che legge.

## Perché è così importante

Prima dei signal, Angular doveva controllare **tutto l'albero dei componenti** per capire cosa fosse cambiato. Con i signal sa esattamente quale pezzo di interfaccia dipende da quale dato, e aggiorna solo quello.

Secondo uno studio recente, il 90% delle applicazioni Angular in produzione soffre di problemi di performance legati alla change detection. Con i signal questi problemi vengono eliminati del tutto.

## Un esempio pratico

Immaginiamo un carrello:

```ts
@Component({
  selector: 'app-carrello',
  template: `
    @for (item of items(); track item.id) {
      <div>{{ item.nome }} · {{ item.prezzo }} €</div>
    }
    <strong>Totale: {{ totale() }} €</strong>
  `,
})
export class Carrello {
  items = signal<Item[]>([]);
  totale = computed(() => this.items().reduce((acc, i) => acc + i.prezzo, 0));

  aggiungi(item: Item) {
    this.items.update(lista => [...lista, item]);
  }
}
```

Nota l'`update` con un **nuovo array**: se modifichi l'array esistente con `push`, il signal non si accorge del cambiamento. È l'errore più comune che vedo nei corsi.

## E gli effect?

Gli `effect` servono per reagire ai cambiamenti con effetti collaterali: salvare nel localStorage, loggare, chiamare un'API. Il consiglio è usarli poco: se puoi ottenere lo stesso risultato con un `computed`, è quasi sempre la scelta migliore.

```ts
effect(() => {
  localStorage.setItem('carrello', JSON.stringify(this.items()));
});
```

## Conclusione

I signal non sono una moda: sono il nuovo modello mentale di Angular. Tutti i grandi team li hanno già adottati e chi non lo fa resterà indietro. Se non li hai ancora provati, parti da un componente piccolo e converti un pezzo alla volta: vedrai che dopo qualche giorno non vorrai più tornare indietro.

Nel prossimo articolo vediamo come farli convivere con RxJS. Se hai domande, scrivile nei commenti!
