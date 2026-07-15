import type { Article } from '@/types';

function id(slug: string) {
  return `seed-${slug}`;
}

const NOW = '2026-07-15T00:00:00.000Z';

export const SEED_ARTICLES: Article[] = [
  // ─── Eras ────────────────────────────────────────────────────────────────────
  {
    id: id('001'),
    title: 'The Birth of Progressive House',
    subtitle: '1990 – 1993',
    category: 'Era',
    year: 1990,
    yearEnd: 1993,
    tags: ['origins', 'UK', 'progressive', 'house'],
    sortKey: 10,
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
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('002'),
    title: 'The Crossover Years',
    subtitle: '1993 – 1996',
    category: 'Era',
    year: 1993,
    yearEnd: 1996,
    tags: ['evolution', 'UK', 'trance', 'crossover'],
    sortKey: 20,
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
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('003'),
    title: 'Trance Becomes Its Own Thing',
    subtitle: '1996 – 2000',
    category: 'Era',
    year: 1996,
    yearEnd: 2000,
    tags: ['trance', 'uplifting', 'Germany', 'UK', 'global'],
    sortKey: 30,
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

**German Trance** (Mfs, Eye Q, Harthouse, later ZYX/Kontor): more direct, higher energy, less interested in dynamics. Faster arrival at the peak.

## The Superclub Era

Trance became the sound of the late-1990s superclub circuit. Events like Gatecrasher, Passion, and Renaissance hosted the big names; Essential Mix on Radio 1 spread the sound nationally and internationally.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('004'),
    title: 'The Commercial Peak and Fragmentation',
    subtitle: '2000 – 2004',
    category: 'Era',
    year: 2000,
    yearEnd: 2004,
    tags: ['commercial', 'Armin', 'ATB', 'fragmentation', 'vocal-trance'],
    sortKey: 40,
    content: `## The Mass-Market Moment

Around 1999–2001 trance achieved genuine mainstream pop crossover. ATB's *9 PM (Till I Come)*, Alice Deejay, Darude's *Sandstorm* — these were chart records. The sound had lost most of its progressive house DNA by this point.

## Subgenre Explosion

Success brought fragmentation:

- **Uplifting trance**: Armin van Buuren, Tiësto, Above & Beyond — the main lineage
- **Vocal trance**: female vocal hooks over driving beats
- **Progressive trance**: an attempt to recover the journey-focused quality; sometimes called *prog-trance*
- **Tech-trance**: harder, more industrial, influenced by techno

## The Backlash

By 2002–2003 serious music press had written off trance as formulaic. The charge wasn't entirely unfair — the major-label end of the market *was* increasingly predictable. But in clubs, more interesting things were still happening beneath the surface.

## What Survived

The DJs who lasted beyond the peak — Sasha, Digweed, Nick Warren, Dave Seaman — were the ones who had never fully abandoned the progressive sensibility. Long sets, darker selections, the journey over the peak.`,
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ─── Artists (DJs) ───────────────────────────────────────────────────────────
  {
    id: id('010'),
    title: 'Sasha',
    subtitle: 'Alexander Coe',
    category: 'Artist',
    year: 1989,
    tags: ['DJ', 'UK', 'Wales', 'Haçienda', 'Renaissance', 'Twilo', 'Shelley\'s', 'progressive-house'],
    sortKey: 110,
    content: `## Who He Is

Alexander Coe, born in Hawarden, Wales, in 1969. Known universally as Sasha, he became the closest thing progressive house had to a pop star — mobbed at venues, covered by mainstream press, a DJ whose name sold out clubs long before his first hour was played.

## How He Got There

He started at Shelley's Laserdome in Longton, Staffordshire, in 1990 — a northern rave venue that was moving away from hardcore toward something deeper. His early sets there built a local following that spread by word of mouth.

The Haçienda connection came through that period. He played the Hot Friday nights at a club already bursting with acid house history, and it was there that his harmonic, melodic style started to distinguish itself from the darker, more functional DJs of the era.

## The DJ Style

What set Sasha apart was his approach to keys. He'd transition tracks over extremely long periods — sometimes four or five minutes — letting the harmonics of two records breathe together before the first fully disappeared. His selections ran the full width of progressive house: deep and atmospheric on one hand, melodic proto-trance on the other.

## Renaissance and Twilo

His partnership with John Digweed at Renaissance (Derby, then Mansfield) became the defining residency of the era. The Twilo residency in New York (from 1997) pushed both DJs toward a more muscular, driving sound — sets ran until midday Sunday, the room had come prepared to stay.

## Relationship to Trance

Unlike Oakenfold, Sasha never fully crossed into trance. His selections remained ambiguous — records that sat exactly on the border — and his productions reflected that refusal to resolve. Some saw this as artistic integrity; others as commercial caution.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('011'),
    title: 'John Digweed',
    category: 'Artist',
    year: 1990,
    tags: ['DJ', 'UK', 'East-Sussex', 'Renaissance', 'Twilo', 'Bedrock', 'progressive-house'],
    sortKey: 111,
    content: `## Who He Is

John Digweed is from Hastings, East Sussex. He started DJing at local clubs and mobile events before breaking into the national circuit — a trajectory typical for DJs from outside the major cities. The story goes that he sent Sasha a tape, Sasha was impressed, and the partnership followed.

## The DJ Style

If Sasha was about harmonic intuition and emotional range, Digweed was about **structure**. A Digweed set was engineered from the ground up. He thought architecturally — where each track sat relative to those around it, how the overall energy of a four-hour set should rise and fall, how to keep a room in sustained tension without releasing it too early.

He played deeper and darker than Sasha as a rule. He was the DJ who made you feel you were going somewhere without being quite sure where.

## Twilo

The Saturday night Twilo residency he shared with Sasha ran for several years. At Twilo the set could run eight, nine, ten hours. Digweed's contribution was the architecture — the long, patient build that made the peak, when it came, feel genuinely earned.

## Bedrock Records

He founded Bedrock in 1999. The Bedrock sound — dark, driving, melodically restrained — became the clearest statement of what progressive house valued over trance: depth over euphoria, patience over instant gratification.

## Later Career

Digweed continued releasing Bedrock material, hosting the Transitions radio show, and touring globally well into the 2020s. He is the artist from this generation who most consistently maintained the progressive values of the early scene.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('015'),
    title: 'Dave Seaman',
    category: 'Artist',
    year: 1990,
    tags: ['DJ', 'UK', 'Barnsley', 'Renaissance', 'Stress-Records', 'Global-Underground', 'progressive-house'],
    sortKey: 115,
    content: `## Who He Is

Dave Seaman is from Barnsley, South Yorkshire. He is one of the most important DJs in the progressive house story and one of the most underappreciated — overshadowed by Sasha and Digweed in the popular memory despite being their genuine peer.

## Stress Records

Seaman co-founded Stress Records with Steve Hillier in the early 1990s. Stress was one of the key progressive house labels of the era — releasing early material from producers who would go on to define the sound, and operating with genuine curatorial seriousness.

## Renaissance

His role at Renaissance as a resident DJ placed him at the centre of the scene. He understood what Renaissance was trying to do — what the journey meant, what the production values meant, what it meant to take a room seriously.

## The DJ Style

Seaman plays melodically but with a darker undertow. His selections have always suggested someone who cares deeply about the emotional arc of a set — playing for the hour and the night, not the moment. There's a melancholy quality to some of his best mixes.

## British DJ Awards

He won British DJ of the Year in the mid-1990s — concrete evidence of his standing at the scene's peak. This was a period when DJs were beginning to be taken seriously as artists.

## Global Underground Athens

His Global Underground Athens album is one of the best entries in that landmark series — a document of how the progressive aesthetic translated to a specific city and room.

## Muzik Magazine

Seaman also wrote for Muzik magazine, the UK dance music press organ of the 1990s. This dual role — practitioner and articulator — is one of the things that distinguishes him.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('016'),
    title: 'Pete Tong',
    category: 'Artist',
    year: 1988,
    tags: ['DJ', 'UK', 'Kent', 'Radio-1', 'FFRR', 'Essential-Mix', 'tastemaker', 'progressive-house'],
    sortKey: 116,
    content: `## Who He Is

Pete Tong is from Dartford, Kent, born 1960. He is the DJ and tastemaker who, more than anyone else, determined which progressive house and trance records broke through to a national audience. His influence operated less through the club floor and more through radio and A&R.

## The Radio 1 Years

Tong joined BBC Radio 1 in 1991. His Friday night show became essential for the progressive and trance community. When Essential Mix launched in 1993 — a two-hour continuous DJ mix on Saturday nights — he had a dedicated audience that would stay up to tape it.

Essential Mix is genuinely one of the most important things to happen to UK dance music. The format treated DJing as seriously as a studio album. Having an Essential Mix was a career moment. The recordings are now historical documents.

## FFRR Records

His position as A&R director at FFRR (London Records) meant he was deciding what got released as well as what got played. A Tong-endorsed record had a different trajectory than one he ignored.

## The Tastemaker Role

Tong is not a journey DJ in the Sasha/Digweed sense — his sets were more functional, less architecturally ambitious. But he played to enormous audiences on radio and at major events. He was the bridge between the underground and the mainstream.

## "It's All Gone Pete Tong"

His name entered UK popular culture as cockney rhyming slang for "wrong." The fact that a club DJ's name became embedded in everyday British idiom tells you something about what the scene meant culturally in the 1990s.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('017'),
    title: 'Nick Warren',
    category: 'Artist',
    year: 1991,
    tags: ['DJ', 'UK', 'Bristol', 'Global-Underground', 'Way-Out-West', 'progressive-house'],
    sortKey: 117,
    content: `## Who He Is

Nick Warren is a Bristol-based DJ and producer, one of the central figures in progressive house and the one most associated with its deeper, more atmospheric end. Where others moved toward trance as the decade progressed, Warren consistently pulled in the opposite direction.

## The Bristol Connection

Bristol had its own flavour of progressive house — slower, more dubby, more influenced by trip-hop. Warren absorbed that influence without becoming a trip-hop DJ; the result was a progressive sound with an unusual weight to it.

## Way Out West

His production project with Jody Wisternoff produced some of the most artistically serious records of the late 1990s scene. *Ajare*, *The Fall*, *Domination* — records that rewarded close listening. Way Out West occupied the same productive border territory as Sasha's productions: progressive in feeling, melodically sophisticated.

## Global Underground

His Global Underground Buenos Aires (GU012) is one of the most-loved entries in that landmark series — melancholy, patient, capturing the deep end of the progressive aesthetic. His Johannesburg album followed.

## Legacy

Warren has consistently maintained progressive values — depth, patience, emotional range — while the wider market moved toward more immediate pleasures. His longevity comes from never chasing the trance wave.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('018'),
    title: 'Graeme Park',
    category: 'Artist',
    year: 1988,
    tags: ['DJ', 'UK', 'Scotland', 'Nottingham', 'Haçienda', 'Nude', 'house', 'progressive-house'],
    sortKey: 118,
    content: `## Who He Is

Graeme Park is a Scottish DJ who relocated to Nottingham and became a resident at the Haçienda alongside Mike Pickering. If Sasha defined what progressive house became, Park was pivotal in defining what it came from.

## The Haçienda

Park's Wednesday night Nude residency, running from 1988, was one of the first spaces in the UK where American house music was given proper weekly presentation to a serious audience. This was before progressive house had a name — but the conditions Park created fed directly into what the progressive scene would be.

## The House Roots

Park's background is unambiguously house — Chicago, Detroit, New York. He never moved as far toward trance as Oakenfold or even Sasha at certain moments. He represents the house tradition that progressive grew from.

## Outside the Metropolitan Bubble

The Haçienda story shows that the most important things in UK dance music in the late 1980s and early 1990s were not happening in London. Park from Scotland, working in Nottingham, finding his career in Manchester — the geography matters.

## Later Career

Park continued DJing, producing, and broadcasting into the 2020s, maintaining the house roots that defined his career.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('019'),
    title: 'Danny Rampling',
    category: 'Artist',
    year: 1987,
    tags: ['DJ', 'UK', 'London', 'Shoom', 'Ibiza', 'acid-house', 'origins'],
    sortKey: 119,
    content: `## Who He Is

Danny Rampling is a London DJ, one of the original four who went to Ibiza in the summer of 1987 alongside Paul Oakenfold, Nicky Holloway, and Johnny Walker, and came back having heard something that would change British club culture permanently.

## The Ibiza Summer of 1987

What those four heard in Ibiza — Alfredo's Amnesia sets mixing Chicago house with rock and European synth-pop at a tempo and in an atmosphere unlike anything in London — was the original experience of music as a full-night journey, of a DJ as the architect of a collective emotional experience. Everything that progressive house would later articulate in theory, Alfredo was doing in practice.

## Shoom

Rampling opened Shoom at the Fitness Centre in Southwark, London, in January 1988. A small club — 300 people maximum — playing acid house and early house. Shoom was the ground zero of British rave culture. The smiley face logo. The white clothes. The sense of collective euphoria that had never quite been replicated before.

Without Shoom there is no Renaissance. Without the acid house summer there is no framework within which progressive house could emerge.

## The Bridge Role

Rampling sits at the beginning of the story rather than its middle. He is not a progressive house DJ in the genre-specific sense — his instincts remained those of someone who wanted rooms to feel united rather than taken on a journey. But his position is foundational.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('012'),
    title: 'Paul Oakenfold',
    category: 'Artist',
    year: 1987,
    tags: ['DJ', 'UK', 'London', 'Ibiza', 'Spectrum', 'Cream', 'Perfecto', 'trance'],
    sortKey: 112,
    content: `## Who He Is

Paul Oakenfold is a south London DJ, one of the original Ibiza four of 1987, and the figure most responsible for the progressive house scene's eventual tilt toward trance. His trajectory through the 1990s is a map of how the genre changed — and of how some artists chose to change with it and others didn't.

## Spectrum at Heaven

After Ibiza, Oakenfold launched Spectrum at Heaven in London in 1988. Larger than Shoom, more deliberate about reach. His instinct was always toward scale — the biggest room, the biggest audience.

## The Haçienda and Cream

He played the Haçienda in its house years, then moved to a residency at Cream in Liverpool. At Cream the Oakenfold story most directly intersects with the progressive-to-trance transition. He arrived playing what you could call progressive house; by the mid-1990s his sets were unambiguously trance. The room moved with him.

## Perfecto Records

His Perfecto label was the vehicle for his taste as tastemaker. Flaming June (BT), Not Over Yet (Grace) — these records defined how trance sounded to a UK mainstream audience. Sophisticated records, well-produced, with enough progressive DNA to avoid being dismissed as cheap pop.

## The Commercial Turn

By the late 1990s Oakenfold had become the biggest DJ in the world by commercial metrics — Las Vegas residencies, Hollywood soundtracks, arena tours. This came at the cost of the scene credibility he'd had in the early 1990s. He represents the direction the music could go when commercial instinct was prioritised over the journey aesthetic.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('014'),
    title: 'Paul van Dyk',
    category: 'Artist',
    year: 1991,
    tags: ['DJ', 'Germany', 'Berlin', 'Tresor', 'trance', 'German-trance'],
    sortKey: 114,
    content: `## Who He Is

Paul van Dyk is a Berlin DJ whose career illuminates the German side of the progressive-to-trance split. His Tresor background gave him a harder, more techno-rooted aesthetic than his UK counterparts, and the trance he helped develop had a different character as a result.

## The Tresor Years

Tresor opened in Berlin in 1991, beneath a former bank vault, and became one of the defining spaces of German techno culture. Van Dyk played at the edges of techno, progressive house, and emerging trance. The Berlin context — post-reunification, empty spaces, no established rules — shaped the music. His trance was harder and more relentless than UK trance; it didn't try to charm you into euphoria, it drove you there.

## Bridging the UK-German Divide

Despite the stylistic differences, van Dyk played extensively in the UK and was embraced by the same audience as Sasha and Digweed. He was the German DJ who most successfully crossed to the UK market without compromising his sound.

## Significance

Van Dyk shows that the trance split happened differently in different places. The German version of the story is not the same as the British one — the roots are in techno rather than in the progressive house tradition, and the resulting sound reflects that.`,
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ─── Labels ──────────────────────────────────────────────────────────────────
  {
    id: id('020'),
    title: 'DeConstruction Records',
    category: 'Label',
    year: 1989,
    yearEnd: 1998,
    tags: ['UK', 'label', 'progressive', 'Sasha'],
    sortKey: 210,
    content: `## Overview

DeConstruction was one of the most important UK labels of the early progressive house era. Founded in 1989 as a dance offshoot of RCA, it had the paradox of being simultaneously underground-credible and major-backed.

## Key Releases

- Sasha — early singles including *Appolonia* and the *Higher Ground* EP
- Various progressive house and proto-trance 12-inches throughout the early 1990s

## The Label Sound

DeConstruction was where the more commercial, melodic end of progressive house found a home — sophisticated and well-produced, sitting between art-house ambition and pure pop.

## Historical Significance

The DeConstruction catalogue shows the sound before it had fully separated from house, when the progressive impulse was still being felt out rather than codified.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('021'),
    title: 'Platipus Records',
    category: 'Label',
    year: 1993,
    tags: ['UK', 'label', 'trance', 'progressive-trance', 'underground'],
    sortKey: 211,
    content: `## Overview

Platipus occupies a fascinating position in the genre history: a UK label sitting at the intersection of progressive house, Goa trance, and what would become progressive trance. Founded by Gary Doyle in 1993, its records were cerebral, psychedelic, and often strange.

## Key Artists

- **Art of Trance** — *Madagascar* and other tracks that defined the label's sound
- **Oliver Lieb** — German producer who bridged the UK-German divide
- **The Ambush** — darker, more menacing tracks

## The Goa Connection

Platipus releases had a clear dialogue with Goa trance — eastern scales, tribal percussion, a sense of spiritual aspiration. This gave the label a distinctly different feel from the more pop-oriented UK trance coming out elsewhere.

## Legacy

Platipus is arguably the most *interesting* label from this transitional period precisely because it didn't fully land in either progressive house or trance.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('022'),
    title: 'Bedrock Records',
    category: 'Label',
    year: 1999,
    tags: ['UK', 'label', 'progressive', 'Digweed', 'deep'],
    sortKey: 212,
    content: `## Overview

John Digweed's Bedrock label, launched in 1999, became the clearest articulation of what *progressive* meant as a sustained aesthetic vision into the 2000s. Where other labels went fully trance or went fully minimal, Bedrock sat obstinately between.

## The Bedrock Aesthetic

- **Dark and driving** — rarely obviously uplifting
- **Technically focused** — production quality and sound design always central
- **Long-form friendly** — tracks built for mixing
- **Melodically restrained** — melody present but not overplayed

## Importance to the Story

Bedrock is the label that most clearly shows the progressive house tradition *surviving* the mainstream trance era intact. While the market was playing faster, louder records, Bedrock kept pushing depth and dynamics.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('023'),
    title: 'Renaissance Records',
    category: 'Label',
    year: 1994,
    tags: ['UK', 'label', 'compilation', 'Sasha', 'Digweed', 'Seaman', 'progressive'],
    sortKey: 213,
    content: `## Overview

Renaissance began as a club night in Derby (and later Mansfield) before launching its record label and, most famously, its mix compilation series. The Renaissance compilations became defining documents of the progressive house era.

## The Mix Series

The Renaissance format — long continuous mixes by a single DJ, packaged with sleek design and proper track listings — established the template for what would follow: Global Underground, Bedrock, Balance.

Key volumes:

- **Volume 1**: Sasha and Digweed — the foundation document
- **Volume 2**: Various artists exploring the full range
- **Volume 3**: Masters of Movement

Dave Seaman was central to the Renaissance night as a resident, alongside Sasha and Digweed.

## Influence on Scene Values

Renaissance helped establish that progressive DJing could be taken *seriously* — not as background entertainment but as an artistic practice. Its attention to packaging and curation raised the bar for what a dance music release could be.`,
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ─── Concepts ────────────────────────────────────────────────────────────────
  {
    id: id('030'),
    title: 'The Journey Metaphor',
    category: 'Concept',
    tags: ['DJing', 'philosophy', 'progressive', 'narrative'],
    sortKey: 310,
    content: `## What It Means

The "journey" is the central metaphor of progressive DJ culture. A great DJ set isn't just a selection of good records — it's a *narrative* with beginning, middle, and end, with dynamic rise and fall, with emotional peaks and necessary troughs.

## How It Manifested

In a practical DJ set, the journey meant:

1. **The opener**: dark, minimal, building — rarely starting with your best record
2. **The build**: gradual increase in energy, BPM, harmonic density
3. **The peak**: the moment everything arrives — the record with most emotional charge
4. **The comedown**: gradual release, ending often slower than it began

## How It Relates to the Trance Split

This is one of the clearest fault lines in the progressive/trance divide. Trance, especially commercial trance, **frontloaded** the peak experience. Individual tracks were built as mini-journeys with their own climax every four minutes. Progressive house made you wait.

The split is partly a different philosophy of **time and reward**.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('031'),
    title: 'Supersaw and the Sound of Trance',
    category: 'Concept',
    tags: ['sound-design', 'synthesiser', 'JP-8000', 'trance-production'],
    sortKey: 311,
    content: `## The Instrument That Defined an Era

The Roland JP-8000 synthesiser (1996) introduced the **supersaw** oscillator — seven detuned sawtooth waves stacked together, producing a massive, shimmering sound. It became the defining timbral element of late-1990s and early-2000s trance.

## Why It Mattered

- Immediately recognisable — you knew you were in trance territory
- Harmonically rich — the detuning created natural chorus and warmth
- Filled mix space efficiently — sat on top of a driving beat without getting lost
- Emotionally charged — the ascending supersaw riff became the vocabulary of trance euphoria

## Connection to Progressive House

Progressive house used synthesisers sparingly and atmospherically. The *arrival* of the supersaw lead in the late 1990s is almost literally audible as the moment progressive house becomes trance.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('032'),
    title: 'Goa Trance — The Other Branch',
    category: 'Concept',
    year: 1992,
    yearEnd: 1998,
    tags: ['Goa', 'psychedelic-trance', 'Israel', 'India'],
    sortKey: 312,
    content: `## A Parallel Evolution

Goa trance developed largely independently of the UK progressive house scene. Its roots are in the beach party culture of Goa, India, where a community of international travellers built an outdoor party scene from the mid-1980s onward.

## Sound Characteristics

- **Psychedelic acid lines**: squelching TB-303-style basslines
- **Eastern scales**: raga-influenced melodic material
- **Higher BPMs**: typically 145–155
- **Hypnotic, looping structures**: aiming for trance state rather than journey

## The Israeli Scene

By the early 1990s Israeli producers (many of whom had been to Goa) began producing Goa trance at home. Astral Projection, Infected Mushroom, and Shpongle emerged from this milieu.

## Connection to Progressive Trance

Platipus Records bridges the two worlds. Later *psytrance* and *progressive psytrance* remain connected to the progressive house tradition in their valuing of journey and texture over peak euphoria.`,
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ─── Tracks ──────────────────────────────────────────────────────────────────
  {
    id: id('040'),
    title: 'Sasha — Xpander',
    subtitle: '1999, Deconstruction',
    category: 'Track',
    year: 1999,
    tags: ['Sasha', 'progressive', 'Xpander-EP'],
    sortKey: 411,
    content: `## The Record

The Xpander EP (1999) is Sasha's definitive production statement. The title track is a masterclass in tension — a long, relentless groove that builds without obvious climax, with melodic elements appearing and disappearing rather than arriving triumphantly.

## What It Shows

The Xpander EP sits at the very end of the moment when it was possible to be ambitious within progressive house without being labelled trance. Sasha's production choices — the controlled use of melody, the refusal to go for the obvious euphoric drop — show someone consciously navigating the genre split.

## Legacy

Xpander remains one of the most-played records in serious progressive DJ sets two and a half decades later. It doesn't sound dated in the way peak-era trance records do — because it was always more concerned with texture than fashion.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('042'),
    title: 'BT — Flaming June',
    subtitle: '1997, Perfecto',
    category: 'Track',
    year: 1997,
    tags: ['BT', 'trance', 'Perfecto', 'crossover'],
    sortKey: 412,
    content: `## The Track

*Flaming June* is one of the tracks that most clearly sits exactly on the border between progressive house and trance. Released in 1997 on Oakenfold's Perfecto label, it has the harmonic warmth of progressive house and the melodic directness of trance.

## Significance

*Flaming June* works as a genre litmus test. How you categorise it says something about how you draw the line between progressive and trance — and in 1997, that line hadn't hardened yet.`,
    createdAt: NOW,
    updatedAt: NOW,
  },

  // ─── Venues ──────────────────────────────────────────────────────────────────
  {
    id: id('050'),
    title: 'The Haçienda',
    subtitle: 'Manchester, 1982–1997',
    category: 'Venue / Event',
    year: 1982,
    yearEnd: 1997,
    tags: ['Manchester', 'UK', 'club', 'rave', 'acid-house', 'Graeme-Park', 'Mike-Pickering'],
    sortKey: 510,
    content: `## The Place

The Haçienda (Factory Records, Manchester) is the venue most associated with the early rave and house explosion in the UK. For progressive house, its significance is as a *crucible* rather than a home.

## The Connection

Graeme Park's Wednesday night Nude residency from 1988 was one of the first spaces in the UK where American house music was given proper weekly presentation to a serious audience. Sasha also played here in his early career. The DJ culture the Haçienda incubated — the idea of a DJ reading a room, building a journey — fed directly into the national progressive house scene.

## Why It Matters

The Haçienda wasn't a progressive house club in the genre-specific sense. But the DJs it nurtured carried progressive values into the wider scene.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id('051'),
    title: 'Cream, Liverpool',
    subtitle: '1992 onwards',
    category: 'Venue / Event',
    year: 1992,
    tags: ['Liverpool', 'UK', 'superclub', 'Oakenfold', 'trance'],
    sortKey: 511,
    content: `## The Club

Cream at Nation in Liverpool was one of the defining venues of the mid-to-late 1990s UK progressive/trance scene. Its residencies — Oakenfold, Sasha, Digweed — map the genre transition directly.

## The Progression

- **Early years** (1992–94): progressive house, deep and driving
- **Mid years** (1995–97): the blend moment — progressive records alongside emerging trance
- **Late years** (1997–2000): full trance, uplifting, high energy

## Scale and Influence

Cream grew to hold multiple rooms and thousands of people per night. What was played at Cream was heard and replicated across UK club culture.`,
    createdAt: NOW,
    updatedAt: NOW,
  },
];
