# Landing page del video corso: testi

> Tutto ciò che è tra `[parentesi quadre]` è da completare o confermare.
> Le righe in corsivo che iniziano con _Nota_ sono per te, non vanno in pagina.

---

## 0. SEO e anteprima social

**Title (meta)**
Decision model: Jev e Gemini Decision per sviluppatori | Video corso

**Meta description**
Un'ora di video corso per usare i decision model nelle tue app: domande tipizzate, probabilità e soglie al posto dei paragrafi da interpretare. Con demo in TypeScript.

**Titolo social (og:title)**
Un LLM scrive. Un decision model decide.

**Descrizione social (og:description)**
Jev, Gemini Decision e come farli lavorare insieme a un LLM. Un'ora di video, con codice e demo.

**Slug**
`/decision-model`

---

## 1. Hero

**Occhiello**
Video corso · circa 1 ora · TypeScript

**Titolo**
Un LLM scrive.
Un decision model decide.

**Sottotitolo**
Impara a usare Jev e Gemini Decision per prendere decisioni nel tuo codice: mandi un testo e delle domande, ricevi probabilità che puoi mettere in un `if`.

**Bottone principale**
Inizia il corso

**Bottone secondario**
Guarda il programma

**Riga sotto i bottoni**
Circa 1 ora · Codice delle demo incluso `[confermare]` · Nessuna esperienza di machine learning richiesta

**Testo per la grafica** _(a sinistra l'LLM, a destra il decision model)_

Il commento:
> "Who taught you to code? Useless post."

Un LLM:
> "Il commento potrebbe essere percepito come offensivo, anche se dipende dal contesto…"

Un decision model:
> `offensive: 0.80`

_Nota: lo 0.80 è il valore verificato a ottobre 2026 su `/1-jev/demo1`. La risposta dell'LLM è illustrativa._

**Titoli alternativi**
1. Dal testo alle decisioni
2. Al tuo codice non serve un paragrafo
3. Chiedi all'AI un numero, non un tema

---

## 2. Il problema

**Titolo**
Al tuo codice non serve un paragrafo

**Testo**
Questo commento è offensivo? Questo ticket va al supporto o alle vendite? In questa email c'è un ordine?

Oggi lo chiedi a un LLM. Lui ti risponde con del testo, e il lavoro vero comincia lì: devi imporgli un formato, interpretare la risposta, validarla e gestire i casi in cui il formato non torna. E aspetti che finisca di scrivere, pagando ogni parola.

Per una persona che legge va benissimo. Per una decisione da ripetere centomila volte è lento, costoso e difficile da controllare.

---

## 3. La soluzione

**Titolo**
Un classificatore che non devi addestrare

**Testo**
I decision model non generano testo. Ricevono i tuoi dati e le tue domande, e restituiscono una probabilità per ogni risposta possibile. Le opzioni le scrivi tu, a ogni richiesta.

**Tre colonne**

**Classificatore classico**
Veloce ed economico, ma vuole un dataset etichettato. Aggiungi una categoria e lo riaddestri.

**LLM con un prompt**
Flessibile, ma risponde con testo da interpretare. Più lento e più caro.

**Decision model**
Le categorie le scrivi nella richiesta, come in un prompt. La risposta è tipizzata e con le probabilità, come quella di un classificatore.

**Frase di chiusura**
Non sostituisce un LLM: lo affianca.

---

## 4. Numeri

**3**
tipi di domanda: sì o no, una scelta, un punteggio

**0 $**
il costo dell'output: paghi solo l'input

**circa 1,26 $**
per moderare 100.000 commenti con Jev

**14**
demo da esplorare

_Nota: 1,26 $ = 100.000 chiamate × circa 300 token × 0,042 $ per milione di token (listino Jev). Metti in piccolo: "Stima a listino, circa 300 token a chiamata, `[mese e anno della verifica]`". Le 14 demo sono quelle nella home del progetto: correggi il numero se nel corso ne mostri meno._

---

## 5. Cosa imparerai

**Titolo**
Alla fine del corso saprai

- **Riconoscere quando ti serve un decision model** e quando invece ti serve un LLM.
- **Scrivere domande che funzionano**, con i tre tipi `noul`, `choice` e `score`.
- **Leggere probabilità e confidence** e capire quando fidarti della risposta.
- **Decidere con le soglie**: agire in automatico, chiedere conferma a una persona o passare la mano a un LLM.
- **Combinare decision model e LLM** in quattro modi: controllare, scegliere, proteggere, smistare.
- **Misurare i risultati** sui tuoi dati, confrontando i modelli per accuratezza, tempi e costi.
- **Spiegare come funziona**: da dove arriva la conoscenza del modello e perché a volte sbaglia.

---

## 6. Un assaggio di codice

**Titolo**
Uno state, una domanda, un numero

```ts
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const { answers } = await client.systemOne({
  state: "Who taught you to code? Useless post.",
  questions: {
    offensive: noul("The comment is offensive or insulting"),
  },
});

console.log(answers.offensive.noul); // 0.80
```

**Testo sotto il codice**
La chiamata più semplice del corso è tutta qui. Da 0.80 in poi decide il tuo codice: pubblicare, mandare in revisione o rifiutare. E se cambi la soglia, non devi richiamare il modello.

---

## 7. Programma

**Titolo**
Il programma

_Nota: segue l'ordine del copione. Le durate dei singoli moduli vanno aggiunte a montaggio finito._

**1. Scrivere o decidere**
Modelli che generano e modelli che scelgono. Cosa sono i decision model e in cosa differiscono da un classificatore classico e da un LLM.

**2. Dove usarli**
Moderazione, ticket, email, lead scoring. Un caso concreto: una ricerca immobiliare che trasforma una frase in filtri.

**3. State e domande**
La prima chiamata, poi un ticket di supporto con tre domande insieme. Cosa c'è dentro ogni risposta: `noul`, `choice`, `score`, probabilità e confidence.

**4. La decisione resta nel tuo codice**
Il pattern a tre fasce: automatico, suggerito, manuale. Le soglie come leva di prodotto, da tarare nel tempo.

**5. Come fa a "sapere" le cose?**
Perché riconosce un insulto che nessuno gli ha insegnato: parole come coordinate, attention, probabilità calibrate. E cosa succede quando il testo è ambiguo.

**6. Limiti, costi e alternative**
Cosa non può fare, quanto costa e cosa prendere con cautela nei benchmark dei produttori. Jev, Liquid d1 e Gemini Decision 1 a confronto.

**7. Decision model + LLM**
Le demo con Gemini: riscrivere e verificare, controllare una risposta prima di inviarla, scegliere la migliore fra tre, bloccare le email con istruzioni nascoste, smistare una casella di supporto.

**8. Misurare**
Valutare un CSV di commenti rispetto alle decisioni attese e mettere a confronto i modelli su accuratezza, tempi, token e costi.

**Bonus. Le immagini**
Trovare un oggetto in una foto e disegnare il suo rettangolo in pagina. Una funzione ancora sperimentale in Jev, limiti compresi.

---

## 8. Le demo

**Titolo**
Cosa vedrai funzionare

**Moderazione con soglie regolabili**
Muovi uno slider e la decisione passa da "pubblica" a "da rivedere". Senza una nuova chiamata al modello.

**Gemini riscrive, Jev verifica**
Un commento scortese viene riscritto in tono educato, e un numero ti dice se la riscrittura ha funzionato.

**Tre risposte, una scelta**
Gemini ne propone tre, Jev le valuta in parallelo, il tuo codice tiene la migliore.

**La guardia davanti all'LLM**
Un'email contiene istruzioni nascoste per l'AI. Se supera la soglia, si ferma prima di arrivare a Gemini.

**Lo smart router**
In una casella di supporto le richieste semplici ricevono un template. Solo le altre arrivano all'LLM.

**Quattro modelli, stessa domanda**
Jev, Gemini Decision, Flash e Flash Lite affiancati: risposta, tempo, token e costo stimato.

**Bottone**
Prova le demo

_Nota: link https://jev-eight-mu.vercel.app/. Aggiungi vicino al bottone: "Per usarle può servirti la tua chiave API" `[confermare]`._

---

## 9. Per chi è

**Titolo**
È per te se

- sviluppi applicazioni web e vuoi aggiungere l'AI dove serve davvero;
- usi già un LLM per classificare testi e sei stanco di interpretare le sue risposte;
- gestisci commenti, ticket, email o contatti in grandi quantità;
- vuoi capire cosa c'è dietro, senza studiare machine learning.

**Titolo**
Non è per te se

- cerchi un corso su come scrivere prompt per generare testi;
- vuoi addestrare un modello tuo da zero;
- non hai mai scritto codice.

**Cosa ti serve**
Le basi di JavaScript o TypeScript. Per provare il codice, Node.js e una chiave API: nel corso usiamo Vercel AI Gateway.

---

## 10. Cosa è incluso

- Circa un'ora di video `[in italiano: confermare]`
- Slide animate, da rivedere quando vuoi
- Il codice sorgente delle demo `[confermare]`
- Le demo online, per provarle senza installare nulla
- `[Accesso a vita / aggiornamenti / certificato: solo se previsti]`

---

## 11. Chi ti insegna

**Titolo**
Chi sono `[oppure: Chi siamo]`

**Testo**
`[Nome]`, `[ruolo]`. `[Una frase su cosa fai e da quanto tempo.]` `[Una frase sul perché di questo corso, per esempio: "Ho iniziato a usare i decision model per la ricerca di un sito immobiliare, e da lì è nato questo corso."]`

_Nota: il talk è firmato da Zelda Ailine Luconi e Fabio Biondi. Non so se il corso è di entrambi, quindi la bio è vuota. Il resto della pagina non nomina i docenti._

---

## 12. Prezzo

**Titolo**
Un'ora, e lo usi nel prossimo progetto

**Prezzo**
`[00 €]`

**Sotto il prezzo**
`[Pagamento unico / gratuito / incluso nell'abbonamento]`

**Elenco**
Circa 1 ora di video · Codice delle demo · Slide animate · Bonus sulle immagini

**Bottone**
Inizia il corso

**Riga sotto il bottone**
`[Politica di rimborso, se prevista]`

---

## 13. Domande frequenti

**Devo sapere di machine learning?**
No. La parte su come funziona il modello parte da zero e usa esempi e animazioni, senza formule.

**Non basta un LLM con l'output strutturato?**
In molti casi sì. Ti dà un formato valido, ma resta un modello che scrive la risposta, e paghi anche l'output. Un decision model sceglie tra le tue opzioni e restituisce una probabilità per ognuna: puoi metterci una soglia e vedere quando non è sicuro. Nel corso li confrontiamo sugli stessi dati.

**Un decision model sostituisce il mio LLM?**
No. Non scrive, non riassume, non conversa. Si occupa delle decisioni piccole e ripetute, e lascia all'LLM quello che richiede testo.

**Quanto costa usare questi modelli?**
Paghi solo i token di input. A listino, Jev costa 0,042 $ per milione di token e Gemini Decision 1 costa 0,10 $. I prezzi possono cambiare: controlla sempre quelli ufficiali.

**Quanto sono veloci?**
Nelle nostre demo con Jev, le richieste di testo semplici rispondono in circa tre decimi di secondo. I tempi dipendono dalla rete e dal modello, e nel corso vedi come misurarli.

**Il modello può sbagliare?**
Sì, soprattutto con ironia e testi ambigui. Spesso in quei casi la confidence scende e puoi mandare il testo in revisione, ma non sempre. Per questo una parte del corso è dedicata alle soglie e alla valutazione sui tuoi dati.

**Vale solo per Jev?**
No. Anche Liquid d1 e Gemini Decision 1 usano gli stessi tre tipi di domanda, quindi quello che impari vale su tutti e tre. Le chiamate cambiano da un SDK all'altro.

**Devo usare Next.js?**
No. Le demo sono in Next.js, ma le chiamate ai modelli sono TypeScript e puoi portarle nel tuo stack.

**Il settore cambia in fretta: il corso invecchierà?**
Prezzi e nomi dei modelli cambieranno. Domande, probabilità, soglie e il modo di combinare i modelli restano. `[Se prevedi aggiornamenti, dillo qui.]`

---

## 14. Chiusura

**Titolo**
La prossima volta che chiedi qualcosa all'AI, fatti rispondere con un numero

**Testo**
Un LLM ti risponde con un tema. Un decision model ti dice: risposta D, sicuro all'86%. In un'ora impari a usare il secondo, e a farlo lavorare con il primo.

**Bottone**
Inizia il corso

---

## 15. Microcopy

**Menu**
Cosa impari · Programma · Demo · Domande frequenti

**Bottone nel menu**
Inizia il corso

**Barra fissa su mobile**
Decision model, il video corso · `[00 €]` · Inizia

**Didascalia del trailer**
Guarda l'anteprima (`[0:00]`)

**Se raccogli email prima del lancio**
- Titolo: Il corso sta arrivando
- Testo: Lascia la tua email e ti scriviamo il giorno del lancio.
- Bottone: Avvisami
- Conferma: Fatto. Ti scriviamo appena il corso è online.

**Footer**
© `[anno]` `[nome]` · Privacy · Cookie · Contatti
Jev è un prodotto di TypeSafe AI. Gemini è un marchio di Google. Corso indipendente, non affiliato a TypeSafe AI, Google o Liquid AI. `[confermare]`
