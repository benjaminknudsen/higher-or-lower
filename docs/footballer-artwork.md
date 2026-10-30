# Footballer artwork

Generated using the built-in imagegen tool. These are anonymous fictional illustrations, not likenesses of the named players. Five lean footballer variants replace the bodybuilder-like figures in gameplay. The session assignment and no-neighbouring-duplicate rules are unchanged.

Final assets: `public/images/footballers/player-1.png` through `player-5.png`, 512 × 768 RGBA PNG. Generated originals were resized with alpha preserved. Gameplay uses neutral lighting rather than the previous 2.1× brightness boost. The service-worker check verifies every active figure is cached.

Final prompt shared by all five assets:

Use case: stylized-concept. Asset type: transparent cutout for a football game player card. Create ONE original anonymous adult male association football player, lean slender endurance-athlete proportions, narrow natural shoulders, slim arms and legs, NOT muscular, NOT bodybuilding. Realistic polished sports editorial illustration with readable natural lighting. Black short sleeve football shirt with restrained red side trim, black football shorts, knee-high black socks and football boots, no brands, no numbers, no lettering. Full body standing relaxed in three-quarter rear view, looking towards the pitch; face not identifiable. Both arms resting naturally at sides, no flexing, no superhero pose. Fit the entire head and boots comfortably inside a tall portrait canvas, centered, straight on level camera. Natural fabric and skin detail clearly visible, avoid crushed black shadows. Genuine transparent background, no floor, no text, no watermark.

Each prompt ends with `Distinct variant: <variant>.` in this order:

1. short brown hair
2. short curly black hair and dark skin
3. medium length blond hair
4. short straight black hair and medium skin
5. short red hair and pale skin

The older silhouette documentation describes the former artwork; the files above are now the active gameplay figures.


## Silhouettes for Flest kampe

Flest kampe uses the five lean footballer PNG assets above, rendered as dark anonymous contours with brightness(.08). The older broad WebP figures remain as historical assets but are no longer assigned to gameplay. Adjacent cards retain different figures. Card geometry, text, statistics, controls and game logic are unchanged.


The original five rear-view WebP silhouettes have been restored for Flest kampe at the user’s request to return to the former large rear-view figures. They use the existing 1.55× crop, showing the back of the head and upper back. Other modes retain their existing artwork.


## Lean rear-view replacements

Flest kampe now assigns `public/images/silhouettes/footballer-rear-1.png` through `footballer-rear-5.png`. Built-in imagegen generated five new anonymous lean footballers using the former slim-curls WebP as a style and camera reference. The new assets retain the direct rear view, dark rendering, alpha transparency and existing 1.55× close crop. Broad, bald, tied-up and dreadlocked variants are no longer assigned in this mode. The other modes and gameplay logic are unchanged. Originals are preserved; game assets are resized to 512 × 768 RGBA PNG.

Prompt set (shared specification, with one hair variant per image):

> Use case: stylized-concept. Asset: single transparent portrait footballer silhouette for an existing dark football game. Reference image is style and exact rear-camera reference only. Create a different anonymous adult male professional association football player. Strictly straight back view: back of skull, both ears equally visible, nape and back of shirt; head looking straight ahead away from viewer, no face, no profile, no turning. Lean lightweight endurance-athlete build, narrow natural shoulders, slim arms, not a bodybuilder, no bulging muscles or wide torso. Relaxed arms by sides. Plain black football shirt and black shorts, no branding, no letters, no numbers. Natural realistic anatomy and fabric, almost-black silhouette with restrained charcoal detail matching reference. Full head-to-knees composition matching reference, centered in tall 2:3 canvas, head near top and entire shoulders inside canvas. True transparent alpha background, no floor, no shadow backdrop. Exactly one player, not a sheet. Preserve the rear perspective and dark photographic silhouette style.

Hair variants, in file order: short straight cropped hair; short curly hair; medium-length straight hair reaching the nape, loose, no bun; short wavy hair; medium-length wavy hair, loose, no bun.

Validation: 283 tests, lint and production build/PWA pass. Mobile Chrome check at 390 × 844 in both themes confirms two distinct loaded rear-view assets and no horizontal overflow.
