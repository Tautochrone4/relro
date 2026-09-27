---
layout: page
title: Writing
intro: Notes on securing machines that move. Written for the engineers who have to implement it, not for a procurement checklist.
permalink: /writing/
---

<div class="entries">
{% for post in site.posts %}
  <a class="entry" href="{{ post.url | relative_url }}">
    <span class="entry__date">{{ post.date | date: "%d %b %Y" }}{% if post.topic %} · {{ post.topic }}{% endif %}</span>
    <span class="entry__title">{{ post.title }}</span>
    <span class="entry__sum">{{ post.intro | truncate: 160 }}</span>
  </a>
{% endfor %}
</div>
