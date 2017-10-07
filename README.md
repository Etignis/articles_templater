# articles_templater

Шаблонизатор для генерации статичных страниц.

Скрипты:
- [node/images.js] Генерация разноразмерных изображений
- [node/index.js] Генерация страниц 
- [node/ftp.js] Заливка контента на сайт

## СТАТЬИ

Лежат в папке "source". В папке "source/other" лежат исходники для статей, состоящих по большей части из одной, двух картинок. Или для тех, которые не являются статьями в прясос смысле - юмор, отдельные монстры, схемы и т.д.

### Редактирование  

Статьи могут быть в двух форматах - html (чистый html, с минимальными изменениями встраивается на страницы сайтов) и md (markdown - проще lkx понимания, переводится в html).

Статьи, файл которых начинается с ключевого слова "notready!" не будут отображаться в общем списке статей, хотя будут доступны по прямым ссылкам.

[Синтаксис markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
