-- Build 24 welcome content, posted as @mykkesigler. Run once in Supabase → SQL Editor.

-- Stops with an error if that profile doesn't exist.

begin;

do $$ begin if not exists (select 1 from public.profiles where username = 'mykkesigler') then raise exception 'profile mykkesigler not found'; end if; end $$;

with me as (select id, island, current_location from public.profiles where username = 'mykkesigler')

insert into public.posts (author_id, body, island, posted_from, tags)
select me.id, v.body, me.island, me.current_location, v.tags from me,
(values
  ($lime$Welcome to LIME — de whole Caribbean, one yard. 🌴 Whether you're home on the rock or living abroad, this is your space to link up, share, and big up each other. Tell us where you're from in the comments!$lime$, '{}'::text[]),
  ($lime$Sunday lunch question for the yard: what's the one dish that tastes like home to you? Pelau, oil down, rice and peas, cou-cou and flying fish, pepperpot… drop yours below. 🍲$lime$, array[$lime$food$lime$]::text[]),
  ($lime$Doubles debate time. 🌶️ Slight pepper, heavy pepper, or no pepper at all? And who makes the best doubles outside of Trinidad — share your spot so the diaspora can find it.$lime$, array[$lime$food$lime$]::text[]),
  ($lime$Living abroad but missing de sounds? Share the soca, reggae, dancehall, kompa, zouk or calypso tune you play when you need a little piece of home. 🎶 Check the Culture tab to post full tracks too.$lime$, array[$lime$music$lime$]::text[]),
  ($lime$Carnival season is coming. 🎭 Trinidad & Tobago Carnival is Monday and Tuesday, February 8–9, 2027, and Dominica's carnival season runs January 9 to February 10. Who's playing mas this year? Check Linkup for dates.$lime$, '{}'::text[]),
  ($lime$For everyone in the diaspora: the Roots tab lets you build your family tree privately — names, places and years, all in one spot. Start with your grandparents and see how far back you can go. 🌳$lime$, '{}'::text[]),
  ($lime$Our grandparents carried stories across the water — Anansi, Papa Bois, the soucouyant, duppy tales on the veranda. What story did your family tell you growing up? Share it in Culture → Stories. 📖$lime$, '{}'::text[]),
  ($lime$Looking for work, or hiring? The Wuk tab has job listings and links to Caribbean job boards. If you run a Caribbean-owned business, post your openings and help a cousin out. 💼$lime$, '{}'::text[])
) as v(body, tags);

insert into public.events (host_id, title, description, city, starts_at, category)
select (select id from public.profiles where username = 'mykkesigler'), v.* from (values
  ($lime$Crucian Christmas Festival$lime$, $lime$St. Croix's month-long Christmas carnival: village nights, food fairs, pageants and parades. Runs December 5, 2026 – January 2, 2027. https://www.visitusvi.com/crucian-christmas-festival$lime$, $lime$St. Croix, U.S. Virgin Islands$lime$, $lime$2026-12-05T08:00:00-04:00$lime$::timestamptz, $lime$carnival$lime$),
  ($lime$Dominica Carnival — The Real Mas$lime$, $lime$Dominica's Real Mas carnival season, January 9 – February 10, 2027. https://discoverdominica.com/festivals-and-events/$lime$, $lime$Roseau, Dominica$lime$, $lime$2027-01-09T09:00:00-04:00$lime$::timestamptz, $lime$carnival$lime$),
  ($lime$Trinidad & Tobago Carnival$lime$, $lime$The mother of all carnivals: J'ouvert and Carnival Monday on February 8, and Carnival Tuesday on February 9, 2027. https://visittrinidad.tt/things-to-do/carnival/$lime$, $lime$Port of Spain, Trinidad & Tobago$lime$, $lime$2027-02-08T04:00:00-04:00$lime$::timestamptz, $lime$carnival$lime$)
) as v(title, description, city, starts_at, category);

insert into public.culture_music (author_id, title, artist, external_url)
select (select id from public.profiles where username = 'mykkesigler'), v.* from (values
  ($lime$London Is the Place for Me$lime$, $lime$Lord Kitchener$lime$, $lime$https://www.youtube.com/results?search_query=Lord+Kitchener+London+Is+the+Place+for+Me$lime$),
  ($lime$Jean and Dinah$lime$, $lime$Mighty Sparrow$lime$, $lime$https://www.youtube.com/results?search_query=Mighty+Sparrow+Jean+and+Dinah$lime$),
  ($lime$One Love / People Get Ready$lime$, $lime$Bob Marley & The Wailers$lime$, $lime$https://www.youtube.com/results?search_query=Bob+Marley+One+Love+People+Get+Ready$lime$),
  ($lime$Day-O (The Banana Boat Song)$lime$, $lime$Harry Belafonte$lime$, $lime$https://www.youtube.com/results?search_query=Harry+Belafonte+Day-O+Banana+Boat+Song$lime$)
) as v(title, artist, external_url);

insert into public.culture_poems (author_id, title, body)
select (select id from public.profiles where username = 'mykkesigler'), v.* from (values
  ($lime$The Tropics in New York$lime$, $lime$Bananas ripe and green, and ginger-root,
Cocoa in pods and alligator pears,
And tangerines and mangoes and grape fruit,
Fit for the highest prize at parish fairs,

Set in the window, bringing memories
Of fruit-trees laden by low-singing rills,
And dewy dawns, and mystical blue skies
In benediction over nun-like hills.

My eyes grew dim, and I could no more gaze;
A wave of longing through my body swept,
And, hungry for the old, familiar ways,
I turned aside and bowed my head and wept.

— Claude McKay (Jamaica), 1920 · public domain$lime$)
) as v(title, body);

insert into public.culture_stories (author_id, title, body, external_url)
select (select id from public.profiles where username = 'mykkesigler'), v.* from (values
  ($lime$Anansi the Spider$lime$, $lime$The clever spider of West African and Caribbean folklore, who wins by wit instead of strength. Every island has its own Anansi stories.$lime$, $lime$https://en.wikipedia.org/wiki/Anansi$lime$),
  ($lime$Papa Bois$lime$, $lime$Trinidad & Tobago's guardian of the forest and its animals — part man, part beast, and not someone hunters want to cross.$lime$, $lime$https://en.wikipedia.org/wiki/Papa_Bois$lime$),
  ($lime$The Soucouyant$lime$, $lime$The fireball spirit of Eastern Caribbean folklore — an old woman by day who sheds her skin at night. Count the rice grains!$lime$, $lime$https://en.wikipedia.org/wiki/Soucouyant$lime$)
) as v(title, body, external_url);

commit;
