# Third-party notices

Hullscope's ship geometry is original procedural reconstruction. No third-party vessel mesh, photograph, texture, or paid asset is redistributed. Linked reference material remains with its publisher; a link is not a licence to redistribute it.

The self-hosted Barlow Condensed, IBM Plex Sans and IBM Plex Mono fonts are distributed under the SIL Open Font License. Copies are served in `public/licenses/` and included in production builds. Fontsource packages supply the webfont files.

Application dependencies are resolved by `package-lock.json`. React, Three.js, React Three Fiber, Drei, Zustand, Radix UI, Phosphor Icons, Vite, Zod and Meshoptimizer retain their respective package licence notices. The production site includes collected package notices in [`public/licenses/dependencies.txt`](public/licenses/dependencies.txt), regenerated from installed production dependencies by `scripts/license-notices.mjs`. Packages that do not publish a standalone license document are identified in that file. Blender is an external authoring tool and is not distributed with the site.

## Rendering effects

Hullscope uses [N8AO](https://github.com/N8python/n8ao) 2.0.1 by N8python for screen-space ambient occlusion, and Three.js's EffectComposer, SMAAPass and OutputPass for the rendering chain. N8AO's distributed `LICENSE` contains the **CC0 1.0 Universal** dedication; its npm metadata separately lists ISC. The original package licence document is retained in the dependency installation. Hullscope's integration code does not claim authorship of N8AO.

[postprocessing](https://github.com/pmndrs/postprocessing) 6.39.4 is installed as N8AO's peer dependency. It is distributed under the **zlib licence**, with this original notice:

```text
Copyright © 2015 Raoul van Rüschen

This software is provided 'as-is', without any express or implied warranty. In
no event will the authors be held liable for any damages arising from the use of
this software.

Permission is granted to anyone to use this software for any purpose, including
commercial applications, and to alter it and redistribute it freely, subject to
the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim
   that you wrote the original software. If you use this software in a product,
   an acknowledgment in the product documentation would be appreciated but is
   not required.

2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.

3. This notice may not be removed or altered from any source distribution.
```

## Reference subjects

Vessel and operator names identify the reference subjects. Hullscope is an independent educational project, without implied affiliation or endorsement.

The **Black Pearl**, **Jack Sparrow** and **Pirates of the Caribbean** identify fictional subjects associated with Disney. Hullscope’s Black Pearl is an original fan interpretation, not an official Disney model or a verified replica of a film prop. No Disney film meshes, imagery, logos, music or dialogue are redistributed. The original humorous commentary is Hullscope’s, not Disney’s. This project is not affiliated with, sponsored by or endorsed by Disney.

Hullscope’s MIT licence covers its original code and authored material; it does not grant rights to Disney’s characters, fictional subjects, names or other underlying intellectual property. Linked official references remain with their respective rights holders.
