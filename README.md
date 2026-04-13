# Völuspá / Goðafræði - Lestrarapp fyrir fjölskylduna

Þetta er einfalt, hreint React forrit hannað sérstaklega fyrir lestrarlotur með fjölskyldunni. Það inniheldur lesham, glósur og spurningar sem vistast staðbundið í vafranum.

## 📖 Hvernig forritið virkar

### Hvar á að setja / uppfæra kaflana
Ef þú skrifar nýja kafla eða uppfærir textann er það í rótarmöppunni:
- Upprunalega skjalið er `jóngynning.docx` í rót kóðans.
- Textinn er þaðan fluttur yfir í `src/chapters.json`. Forritið grípur **bara** data beint úr þeirri `.json` skrá.

### Hvernig kaflar eru þættaðir (parse)
1. Fyrst notar maður tól eins og `mammoth` til að breyta `jóngynning.docx` yfir í hreint `output.html`.
2. Hlaðið var upp litlu skriftu sem eltir `<p><strong>Kafli...</strong></p>` mynstur í HTML-inu og skilar fínu, tilbúnu JSON gagnasafni. 
3. Ef þú vilt uppfæra bókina er best að keyra `npx mammoth jóngynning.docx output.html` fylgt eftir af `node parse-chapters.mjs`.

### Hvar vistast glósur, spurningar og "lesið" merkingar?
Allt vistast sjálfkrafa og örugglega í **localStorage** í vafranum manns (í tölvunni/spjaldtölvunni sem þú ert að lesa á). 
- Engin þörf á gagnagrunni!
- Athugaðu: Ef þú notar aðra tölvu eða hreinsar sögu að fullu þá munu glósurnar ekki færast á milli tækja.

### Hvernig á að keyra forritið
Til að kveikja á appinu og byrja að lesa dælirðu þessu inn í terminal/skel:
1. Vertu í rótarmöppunni (þar sem unnið er).
2. Keyrslu skipanir:
```bash
npm install     # Ef þú hefur ekki sett upp eða hefur bætt við pökkum
npm run dev     # Ræsir þróunarþjóninn (appið!)
```
3. Opnaðu síðan vafra og farðu á [http://localhost:5173/](http://localhost:5173/) (eða slóðina sem ræsingin prentar).
