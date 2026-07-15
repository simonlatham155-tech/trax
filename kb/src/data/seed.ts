import type { Article } from '@/types';

function id(n: number) {
  return `seed-${String(n).padStart(3, '0')}`;
}

function now() {
  return new Date().toISOString();
}

export const SEED_ARTICLES: Article[] = [
  // ─── Eras ────────────────────────────────────────────────────────────────────
  {
    id: id(1),
    title: 'The Birth of Progressive House',
    subtitle: '1990 – 1993',
    category: 'Era',
    year: 1990,
    yearEnd: 1993,
    tags: ['origins', 'UK', 'progressive', 'house'],
    content: `## Overview

Progressive house emerged in the UK around 1990–1993 as a reaction against the harder, repetitive energy of mainstream rave culture. Where rave leaned on speed and shock, progressive house pursued *journey* — long builds, gradual harmonic shifts, and a sense of emotional arc across a full set or side of vinyl.

## What Made It Different

The defining qualities were:

- **Long, evolving arrangements** — tracks often ran 8–12 minutes, with filters opening slowly across the runtime
- **Sparse, spacious production** — wide reverbs, delayed percussion, and deliberate use of silence
- **Melody as texture** — melodic elements were often buried in the mix rather than foregrounded, creating a hypnotic quality
- **Chicago and Detroit roots openly worn** — producers drew from deep house and proto-techno but pushed tempos up slightly (125–130 BPM) and prioritised tension over groove

## The Sound

The early sound had a particular darkness — minor-key chord progressions, atmospheric pads, and kicks that hit harder than house but without the aggression of hardcore. Basslines were often mid-range, harmonic rather than sub-driven.

## Why It Mattered

Progressive house created the template for long-form DJ culture in the UK. The idea that a DJ could take a room on a 2–3 hour *journey* — rather than simply playing hit after hit — took root here and spread globally through the 1990s.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 10,
  },
  {
    id: id(2),
    title: 'The Crossover Years',
    subtitle: '1993 – 1996',
    category: 'Era',
    year: 1993,
    yearEnd: 1996,
    tags: ['evolution', 'UK', 'trance', 'crossover'],
    content: `## The Scene Fragments

By 1993 the progressive house scene had grown large enough to start pulling in different directions. Two broad trajectories emerged:

### 1. Deeper, Darker Progressive

Some producers pushed further into minimalism — sparser percussion, more abstract atmospherics, and a conscious rejection of overt melody. This strand eventually fed into what we'd call **progressive techno** and later **minimal techno** in the 2000s.

### 2. The Melodic Turn — Proto-Trance

The other direction leaned *into* melody. Synth lines became more prominent. Chord progressions grew more emotional and easier to follow. Arpeggiated sequences crept in from Euro-trance and Goa. BPMs nudged upward to 132–138.

This second strand is the direct ancestor of what we now call trance.

## Key Tension Points

- **Sasha vs. the purists**: Sasha's sets in this period were a flashpoint — he was unafraid to play melodic, uplifting records alongside darker material, which some critics called a commercial compromise
- **Club vs. rave**: Progressive house had established itself in clubs (Ministry of Sound, Cream, Haçienda); the melodic trance wave was pulling back toward rave-scale events
- **UK vs. Germany**: German producers (ATB, Cosmic Gate's predecessors) were building a faster, more euphoric sound with a very different aesthetic

## The Moment of Split

By 1995–96 it became hard to describe Sasha & Digweed, Paul van Dyk, and Robert Miles as being in the same genre. They all emerged from the same moment, but the sounds had genuinely diverged.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 20,
  },
  {
    id: id(3),
    title: 'Trance Becomes Its Own Thing',
    subtitle: '1996 – 2000',
    category: 'Era',
    year: 1996,
    yearEnd: 2000,
    tags: ['trance', 'uplifting', 'Germany', 'UK', 'global'],
    content: `## Trance Arrives as a Genre Category

By 1996 record shops, magazines, and radio shows had given up trying to file trance under progressive house. It had its own bins, its own charts, its own events.

## What Defined This Trance

- **BPM range**: 136–142, often higher in harder subgenres
- **Structure**: strong intro build, 16-bar loops, a break section with chord melody exposed, then a euphoric drop back into the groove
- **Sound design**: supersaw leads (Roland JP-8000 was everywhere), filtered arpeggios, lush reverb on pads
- **Emotion**: explicitly uplifting — the genre consciously aimed at euphoria in a way that progressive house had always been ambivalent about

## UK Trance vs. German Trance

These two strands sounded quite different:

**UK Trance** (Platipus, Hooj Choons): retained some of the darker, more atmospheric quality of progressive house. Tracks breathed more. Builds were slower. The euphoria felt earned rather than given.

**German Trance** (Mfs, Eye Q, Harthouse at first, then later ZYX/Kontor): more direct, higher energy, less interested in dynamics. Faster arrival at the peak.

## The Superclub Era

Trance became the sound of the late-1990s superclub circuit. Events like Gatecrasher, Passion, and Renaissance hosted the big names; Essential Mix on Radio 1 spread the sound nationally and internationally. This commercial success would eventually fracture the scene again.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 30,
  },
  {
    id: id(4),
    title: 'The Commercial Peak and Fragmentation',
    subtitle: '2000 – 2004',
    category: 'Era',
    year: 2000,
    yearEnd: 2004,
    tags: ['commercial', 'Armin', 'ATB', 'fragmentation', 'vocal trance'],
    content: `## The Mass-Market Moment

Around 1999–2001 trance achieved genuine mainstream pop crossover. ATB's *9 PM (Till I Come)*, Alice Deejay, Darude's *Sandstorm* — these were chart records. The sound had lost most of its progressive house DNA by this point.

## Subgenre Explosion

Success brought fragmentation:

- **Uplifting trance**: Armin van Buuren, Tiësto, Above & Beyond — the main lineage
- **Vocal trance**: Emma Shapplin samples, female vocal hooks over driving beats
- **Progressive trance**: an attempt to recover the journey-focused quality; sometimes called *prog-trance* to distinguish from classic progressive house
- **Tech-trance**: harder, more industrial, influenced by techno; Kai Tracid, Plastic Boy
- **Psychedelic / Goa trance**: a separate evolutionary branch (see Goa article)

## The Backlash

By 2002–2003 serious music press had written off trance as formulaic. The charge wasn't entirely unfair — the major-label end of the market *was* increasingly predictable. But in clubs and on community radio, more interesting things were still happening beneath the surface.

## What Survived

The artists who lasted beyond the peak — Sasha, Digweed, Nick Warren — were the ones who had never fully abandoned the progressive sensibility. They kept playing long sets, kept threading darker and more unexpected records into their selections, and kept the journey metaphor alive.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 40,
  },

  // ─── Artists ─────────────────────────────────────────────────────────────────
  {
    id: id(10),
    title: 'Sasha',
    subtitle: 'Alexander Coe',
    category: 'Artist',
    year: 1990,
    tags: ['DJ', 'producer', 'UK', 'Haçienda', 'Twilo', 'Renaissance'],
    content: `## Who He Is

Alexander Coe — known universally as Sasha — is for many people the artist who most completely embodied the transition from progressive house to its later forms. A Welsh DJ who came up through the Haçienda scene, he was already a superstar by the mid-1990s.

## The DJ Style

Sasha's playing style was characterised by:

- **Seamless, long transitions**: blending tracks over minutes rather than bars
- **Key mixing**: a near-obsessive ear for harmonic compatibility between records
- **Dynamic range**: genuine use of quiet and space within a set to make peaks hit harder
- **Eclecticism within a mood**: playing progressive, trance, and occasionally techno elements in the same hour without it feeling jarring

## Production

As a producer Sasha was less prolific than some peers but his output was consistently interesting:

- **BT collaboration**: their work together (*Embracing the Sunshine*, *Unknown Territory*) sat exactly at the border of progressive house and the melodic trance that was emerging
- **Xpander EP** (Deconstruction, 1999): probably his definitive statement as a producer — driving, intelligent, emotionally rich
- **Invol2ver** (2008): a late-career record that showed how far the progressive sensibility could travel from its roots while keeping its core values

## Legacy

Sasha's career trajectory is almost a map of how progressive house became trance and then evolved beyond a single genre label. His refusal to be pinned to one sound is both his defining quality and what makes him difficult to categorise neatly.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 110,
  },
  {
    id: id(11),
    title: 'John Digweed',
    category: 'Artist',
    year: 1991,
    tags: ['DJ', 'UK', 'Bedrock', 'Renaissance', 'Twilo'],
    content: `## Who He Is

John Digweed is the other half of the partnership with Sasha that defined a generation of progressive DJ culture. His residency at Twilo in New York (shared with Sasha through the late 1990s) was one of the most influential club runs in the history of electronic music.

## The DJ Style

Where Sasha could be showy and harmonic, Digweed's strength was **architecture**. A Digweed set was engineered — tracks fitted together with a structural logic that made the whole greater than the parts. He rarely played obvious selections; his ear for deep cuts and import-only releases was exceptional.

## Bedrock Records

Digweed founded Bedrock Records in 1999, which became one of the defining progressive trance/house labels. The label consistently sat between the worlds — neither pure house nor full trance — and its catalogue maps the sound that eventually settled as *progressive* in the modern sense.

## The Bedrock Sound

- Deep bass
- Hypnotic, rolling rhythms
- Melodic elements present but subtle
- Long-form structures
- A preference for darkness over euphoria

## Global Influence

Through the Renaissance and Global Underground compilation series, Digweed's mixing reached a global audience in the late 1990s and shaped what DJing *meant* to a whole generation of producers and fans.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 111,
  },
  {
    id: id(12),
    title: 'Paul Oakenfold',
    category: 'Artist',
    year: 1989,
    tags: ['DJ', 'producer', 'UK', 'Gatecrasher', 'Perfecto', 'Ibiza'],
    content: `## Who He Is

Paul Oakenfold is probably the artist most responsible for the *sound* of what became mainstream trance in the UK. He came from an Ibiza and acid house background, moved through progressive house, and by the mid-1990s was making and playing music that was unambiguously trance.

## The Ibiza Connection

Oakenfold's nights at Spectrum (Heaven, London) in the early 1990s were the crucible. Ibiza anthems mixed with progressive records mixed with early trance imports — the atmosphere was deliberately euphoric in a way that classic progressive house was not.

## Perfecto Records

His Perfecto label released some of the most important trance records of the 1990s:

- BT — *Flaming June*
- Grace — *Not Over Yet*
- Various Oakenfold productions and remixes that moved closer and closer to the archetypal trance sound

## The Bunker Sound

Oakenfold's residency at Cream (Liverpool) and his radio shows were instrumental in spreading the uplifting trance aesthetic outside London. His *Tranceport* mix album (1998) is one of the clearest snapshots of the genre at its mid-period peak.

## Relationship to Progressive House

Of the big-name DJs who emerged from progressive house, Oakenfold was the one who most completely *left* it behind. By 1997–98 his sets had the energy and aesthetic of trance rather than progressive, which opened him to mainstream success but also the charge of having abandoned his roots.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 112,
  },
  {
    id: id(13),
    title: 'Leftfield',
    category: 'Artist',
    year: 1990,
    tags: ['producer', 'UK', 'Hard Hands', 'leftfield house', 'conceptual'],
    content: `## Who They Are

Neil Barnes and Paul Daley formed Leftfield in 1989. They are a critical case study in progressive house because they represent the strand that *didn't* go toward trance — the one that went toward something harder to categorise.

## The Sound

Leftfield's sound was always distinctive:

- A reggae/dub influence absent from most UK house
- Political content and spoken word
- Industrial textures alongside deep house rhythm
- A willingness to go slow, dark, and uncomfortable

## *Leftism* (1995)

Their debut album is one of the key records in understanding what progressive house could be at its most ambitious. It's a proper album in the rock sense — a sequenced work with a narrative arc — made from electronic dance music building blocks.

Tracks like *Song of Life*, *Original*, and *Space Shanty* show what the progressive impulse could achieve when freed from the 12-inch single format.

## *Rhythm and Stealth* (1999)

Their second album is darker and harder. By this point the music had moved away from anything that could be called house and into a space that anticipated early 2000s electronic genres.

## Legacy

Leftfield are proof that the progressive impulse in house music had more directions to travel than toward trance. They took the journey metaphor into genuinely experimental territory.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 113,
  },
  {
    id: id(14),
    title: 'Paul van Dyk',
    category: 'Artist',
    year: 1991,
    tags: ['DJ', 'producer', 'Germany', 'Berlin', 'Tresor', 'trance'],
    content: `## Who He Is

Paul van Dyk is the central figure in understanding how trance developed on the German side of the split. A Berlin DJ with roots in the underground Tresor scene, he brought a harder, more techno-influenced sensibility to the emerging trance sound.

## Berlin Context

Van Dyk's background was in the reunified Berlin club scene — Tresor, Turbine Rosenheim — which gave him a very different aesthetic baseline from the UK progressive house world. His trance was less melodically warm, more driving and relentless.

## *45 RPM* and *Vorsprung Dyk Technik*

These early compilation mixes (1994 and 1995) document the moment when the harder end of progressive house was becoming trance in Germany. The records in the mix are more aggressive, the breakdowns shorter, the euphoria more abrupt.

## Bridging the Scenes

Despite the stylistic differences, van Dyk had a genuine dialogue with the UK scene — he played regularly in the UK, was embraced by the same audience as Sasha and Digweed, and his *In Between* album (2007) showed a career-long interest in more nuanced production.

## The Trance Ambassador

More than almost anyone else, van Dyk carried trance into places it hadn't been — US clubs, festivals, mainstream credibility — while maintaining a connection to the underground values of his Berlin origins.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 114,
  },

  // ─── Labels ──────────────────────────────────────────────────────────────────
  {
    id: id(20),
    title: 'DeConstruction Records',
    category: 'Label',
    year: 1989,
    yearEnd: 1998,
    tags: ['UK', 'label', 'progressive', 'Sasha'],
    content: `## Overview

DeConstruction was one of the most important UK labels of the early progressive house era. Founded in 1989 as a dance offshoot of RCA, it had the paradox of being simultaneously underground-credible and major-backed.

## Key Releases

- Sasha — early singles including *Appolonia* and the *Higher Ground* EP
- BT — *Flaming June* (before he moved to Perfecto)
- Various progressive house and proto-trance 12-inches throughout the early 1990s

## The Label Sound

DeConstruction was where the more commercial, melodic end of progressive house found a home. Records on the label were sophisticated and well-produced — they sat between the art-house ambition of harder labels and the pure pop of mainstream dance.

## Decline

The label wound down by the late 1990s as the major labels restructured their dance divisions. Many of its key artists — Sasha prominently — moved to different setups as their careers matured.

## Historical Significance

As a document of early progressive house, the DeConstruction catalogue is essential. These records show the sound before it had fully separated from house, when the progressive impulse was still being felt out rather than codified.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 210,
  },
  {
    id: id(21),
    title: 'Platipus Records',
    category: 'Label',
    year: 1993,
    tags: ['UK', 'label', 'trance', 'progressive trance', 'UK underground'],
    content: `## Overview

Platipus occupies a fascinating position in the genre history: it was a UK label that released some of the most forward-looking records of the mid-1990s, sitting at the intersection of progressive house, Goa trance, and what would become the *progressive trance* of the late decade.

## Founding and Focus

Founded by Gary Doyle in 1993, Platipus had a more psychedelic, texture-focused aesthetic than the melodically warmer DeConstruction or the harder German labels. Its records were cerebral and often strange.

## Key Artists

- **Art of Trance** — *Madagascar* and other tracks that defined the label's sound
- **Oliver Lieb** — German producer who bridged the UK-German divide
- **The Ambush** — darker, more menacing tracks
- **James Munro** — ambient and experimental work

## The Goa Connection

Platipus releases had a clear dialogue with Goa trance — the use of eastern scales, tribal percussion layered over driving sequences, a sense of spiritual or transcendent aspiration. This gave the label a distinctly different feel from the more pop-oriented UK trance coming out elsewhere.

## Legacy

Platipus is arguably the most *interesting* label from this transitional period precisely because it didn't fully land in either progressive house or trance. Its records document the moment before the genre lines hardened.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 211,
  },
  {
    id: id(22),
    title: 'Bedrock Records',
    category: 'Label',
    year: 1999,
    tags: ['UK', 'label', 'progressive', 'Digweed', 'deep'],
    content: `## Overview

John Digweed's Bedrock label, launched in 1999, became the clearest articulation of what *progressive* meant as a sustained aesthetic vision into the 2000s. Where other labels went fully trance or went fully minimal, Bedrock sat obstinately between.

## The Bedrock Aesthetic

The label sound is:

- **Dark and driving** — rarely cheerful or obviously uplifting
- **Technically focused** — production quality and sound design are always central
- **Long-form friendly** — tracks are built for mixing, with long intros and outros
- **Melodically restrained** — melody present but not overplayed

## Key Artists

- **Nick Muir** — Digweed's production partner
- **Cass & Slide** — defining the harder progressive sound
- **Tempered** — more textural, atmospheric material
- **Various international producers** — the label always had a global reach

## Importance to the Story

Bedrock is the label that most clearly shows the progressive house tradition *surviving* into the mainstream trance era intact. While the wider market was playing faster, louder, more euphoric records, Bedrock kept pushing depth and dynamics.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 212,
  },
  {
    id: id(23),
    title: 'Renaissance Records',
    category: 'Label',
    year: 1994,
    tags: ['UK', 'label', 'compilation', 'Sasha', 'Digweed', 'progressive'],
    content: `## Overview

Renaissance began as a club night in Derby (and later Mansfield) before launching its record label and, most famously, its mix compilation series. The Renaissance compilations became defining documents of the progressive house era and the transition to trance.

## The Mix Series

The Renaissance compilation format — long continuous mixes by a single DJ, packaged with sleek design and genuine track listings — established the template for what would follow: Global Underground, Bedrock, Balance, and dozens more.

Key volumes in the series:

- **Volume 1**: Sasha and Digweed — the foundation document
- **Volume 2**: Various artists format, exploring the full range
- **Volume 3**: Masters of Movement — broader stylistic range

## The Club Night

The Renaissance club night itself was a key space for the progressive sound to develop and find an audience outside London. Its aesthetic — dramatic lighting, serious music policy, no pop crossover — set the tone for UK progressive club culture.

## Influence on the Scene's Values

Renaissance helped establish the idea that progressive DJing and electronic music could be taken *seriously* — not as background entertainment but as an artistic practice. The label's attention to packaging, track selection, and presentation raised the bar for what a dance music release could look like.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 213,
  },

  // ─── Concepts ────────────────────────────────────────────────────────────────
  {
    id: id(30),
    title: 'The Journey Metaphor',
    category: 'Concept',
    tags: ['DJing', 'philosophy', 'progressive', 'narrative'],
    content: `## What It Means

The "journey" is the central metaphor of progressive DJ culture. The idea is that a great DJ set isn't just a selection of good records — it's a *narrative* with beginning, middle, and end, with dynamic rise and fall, with emotional peaks and necessary troughs.

## Where It Came From

The concept has roots in:

- **Larry Heard and deep house**: the idea that dance music could be emotionally sophisticated, not just functional
- **Long-form radio**: John Peel's programme showed that sequencing and curation were artistic acts
- **Classical music**: the arc of a symphony or a song cycle — though most progressive DJs wouldn't have framed it this way explicitly

## How It Manifested

In a practical DJ set, the journey meant:

1. **The opener**: dark, minimal, building — rarely starting with your best record
2. **The build**: gradual increase in energy, BPM, harmonic density
3. **The peak**: the moment everything arrives — not necessarily the loudest record, but the one with most emotional charge
4. **The comedown**: gradual release, ending often slower than it began

## How It Relates to the Trance Split

This is one of the clearest fault lines in the progressive/trance divide. Trance, especially commercial trance, **frontloaded** the peak experience. Individual tracks were built as mini-journeys with their own climax every four minutes. Progressive house made you wait.

The split is partly a different philosophy of **time and reward**.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 310,
  },
  {
    id: id(31),
    title: 'Supersaw and the Sound of Trance',
    category: 'Concept',
    tags: ['sound design', 'synthesiser', 'JP-8000', 'trance production'],
    content: `## The Instrument That Defined an Era

The Roland JP-8000 synthesiser, released in 1996, introduced the **supersaw** oscillator — a single oscillator that stacked seven sawtooth waves, each slightly detuned, producing a massive, shimmering sound with an inherent sense of motion and movement.

## Why It Mattered

The supersaw became the defining timbral element of late-1990s and early-2000s trance for several reasons:

- It was **immediately recognisable** — you knew you were in trance territory
- It was **harmonically rich** — the detuning created natural chorus and warmth
- It **filled mix space** very efficiently — one supersaw line could sit on top of a driving beat without getting lost
- It was **emotionally charged** — the ascending supersaw riff became the vocabulary of trance euphoria

## Other Key Elements

The full trance production palette included:

- **Filtered arpeggios**: typically 16th-note patterns on synths, opening through long filter sweeps
- **Massive reverb**: particularly on the supersaw lead, creating a sense of enormous space
- **Sidechained kick**: the pumping compression on pads tied the groove to the bass drum viscerally
- **Breakdown structure**: exposing the chord progression with pads and no percussion before the drop

## Connection to Progressive House

Progressive house used synthesisers too, but sparingly and atmospherically rather than as lead elements. The *arrival* of the supersaw lead in the late 1990s is almost literally audible as the moment progressive house becomes trance.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 311,
  },
  {
    id: id(32),
    title: 'Goa Trance — The Other Branch',
    category: 'Concept',
    year: 1992,
    yearEnd: 1998,
    tags: ['Goa', 'psychedelic trance', 'Israel', 'India', 'Shpongle'],
    content: `## A Parallel Evolution

Goa trance developed largely independently of the UK progressive house scene, though there are connection points. Its roots are in the beach party culture of Goa, India, where a community of international travellers built an outdoor party scene from the mid-1980s onward.

## Sound Characteristics

Goa trance is immediately distinguishable:

- **Psychedelic acid lines**: squelching, morphing TB-303-style basslines
- **Eastern scales and ornaments**: raga-influenced melodic material
- **Higher BPMs**: typically 145–155
- **Hypnotic, looping structures**: less concerned with journey than with *trance state* in the literal sense
- **No concession to mainstream taste**: aggressively weird by pop standards

## The Israeli Scene

By the early 1990s Israeli producers (many of whom had been to Goa) began producing Goa trance at home. Labels like BNE and artists like Astral Projection, Infected Mushroom, and Shpongle emerged from this milieu.

## Connection to Progressive Trance

Paradoxically, Goa trance and progressive house influenced each other despite the very different aesthetics:

- The *psychedelic* dimension of progressive house — the headphone-listening, late-night, introspective quality — comes partly from this direction
- Platipus Records in particular bridges the two worlds
- Later *psytrance* and *progressive psytrance* are descended from this strand and remain connected to the progressive house tradition in their valuing of journey and texture over peak euphoria`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 312,
  },

  // ─── Tracks ──────────────────────────────────────────────────────────────────
  {
    id: id(40),
    title: 'Leftfield — Not Forgotten',
    subtitle: '1992, Hard Hands',
    category: 'Track',
    year: 1992,
    tags: ['Leftfield', 'progressive', 'foundational', 'UK'],
    content: `## Why It Matters

*Not Forgotten* is one of the foundation documents of UK progressive house. Released in 1992 on Leftfield's own Hard Hands label, it showed what progressive could be when producers were willing to let music breathe.

## The Track

The track runs over eight minutes and never rushes. A gospel-influenced vocal sample sits over deep, rolling percussion, while synth textures open and close slowly in the background. There's no obvious hook in the pop sense — the track *is* the journey.

## Production Approach

What's striking listening now is the **restraint**. Nothing enters before it's needed. The kick drum is prominent but sits in the mix rather than dominating it. The vocal arrives like a surprise even though the track has been building toward it.

## In Context

Hearing *Not Forgotten* alongside records being made at the same time shows exactly what made progressive house different. Where other UK dance records were chasing energy and impact, Leftfield were chasing *atmosphere*.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 410,
  },
  {
    id: id(41),
    title: 'Sasha — Xpander',
    subtitle: '1999, Deconstruction',
    category: 'Track',
    year: 1999,
    tags: ['Sasha', 'progressive', 'late-period', 'Xpander EP'],
    content: `## The Record

The Xpander EP (1999) is Sasha's definitive production statement. The title track in particular is a masterclass in tension — a long, relentless groove that builds without obvious climax, with melodic elements appearing and disappearing rather than arriving triumphantly.

## What It Shows

The Xpander EP sits at the very end of the moment when it was possible to be ambitious within progressive house without being labelled trance. Sasha's production choices — the controlled use of melody, the refusal to go for the obvious euphoric drop — show someone consciously navigating the genre split.

## Sound Design

The production is dense and detailed. The filtering is gradual and purposeful. Where contemporary trance records were opening filters dramatically for maximum impact, Sasha uses filter movement as a conversational tool rather than a climax delivery system.

## Legacy

Xpander remains one of the most-played records in serious progressive DJ sets two and a half decades later. It doesn't sound dated in the way that many peak-era trance records do — partly because it was always more concerned with texture than fashion.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 411,
  },
  {
    id: id(42),
    title: 'BT — Flaming June',
    subtitle: '1997, Perfecto',
    category: 'Track',
    year: 1997,
    tags: ['BT', 'trance', 'Perfecto', 'crossover'],
    content: `## The Track

*Flaming June* is one of the tracks that most clearly sits exactly on the border between progressive house and trance. Released in 1997 on Oakenfold's Perfecto label, it has the harmonic warmth of progressive house and the melodic directness of trance.

## The Sound

The track builds from a sparse rhythm into a full arrangement centred on a descending chord progression. The melody is present and identifiable — more immediately accessible than a Sasha record of the same period — but the production is still restrained enough that you could argue it both ways.

## Brian Transeau (BT)

BT is a fascinating figure in this narrative. An American producer with a classical training background, his work was consistently more melodically sophisticated than most dance producers, and he was never fully comfortable in either the progressive or the trance camp.

## Significance

*Flaming June* works as a kind of genre litmus test. How you categorise it says something about how you draw the line between progressive and trance — and in 1997, that line hadn't hardened yet.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 412,
  },

  // ─── Venues / Events ─────────────────────────────────────────────────────────
  {
    id: id(50),
    title: 'The Haçienda',
    subtitle: 'Manchester, 1982–1997',
    category: 'Venue / Event',
    year: 1982,
    yearEnd: 1997,
    tags: ['Manchester', 'UK', 'club', 'rave', 'acid house'],
    content: `## The Place

The Haçienda (Factory Records, Manchester) is the venue most associated with the early rave and house explosion in the UK, but its significance for progressive house is as a *crucible* rather than a home.

## The Connection

Sasha got his start here. The Haçienda's Friday night *Hot* and Saturday *Zumbar* nights in the early 1990s were where UK progressive DJing as a practice was developed — the idea of reading a room, building a journey, playing across styles with a consistent emotional thread.

## What Happened There

By 1990–91 the Haçienda was already dealing with the tensions that would eventually close it — gangster activity, tabloid panic, police pressure. But the music policy remained adventurous, and the DJ culture it incubated fed directly into the national progressive house scene.

## Why It Matters to This Story

The Haçienda wasn't a progressive house club in the genre-specific sense — its history spans acid house, rave, indie crossover, and everything in between. But the DJs it nurtured, particularly in the early 1990s, carried progressive values into the wider scene.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 510,
  },
  {
    id: id(51),
    title: 'Cream, Liverpool',
    subtitle: '1992 onwards',
    category: 'Venue / Event',
    year: 1992,
    tags: ['Liverpool', 'UK', 'superclub', 'Oakenfold', 'trance'],
    content: `## The Club

Cream at Nation in Liverpool was one of the defining venues of the mid-to-late 1990s UK progressive/trance scene. Its residencies — Oakenfold, Sasha, Digweed — map the genre transition directly.

## The Progression

Cream's musical history across the 1990s is almost a diagram of the progressive-to-trance journey:

- **Early years** (1992–94): progressive house, deep and driving
- **Mid years** (1995–97): the blend moment — progressive records alongside emerging trance
- **Late years** (1997–2000): full trance, uplifting, high energy

## The Oakenfold Residency

Oakenfold's time at Cream is particularly significant. He brought records that were more overtly melodic and euphoric than what had come before, gradually shifting the room's expectations. When trance arrived fully, the audience was already primed for it.

## Scale and Influence

Cream grew to hold multiple rooms and thousands of people per night. This scale — and the national radio exposure that came with it — made it influential far beyond Liverpool. What was played at Cream was heard and replicated across UK club culture.`,
    createdAt: now(),
    updatedAt: now(),
    sortKey: 511,
  },
];
