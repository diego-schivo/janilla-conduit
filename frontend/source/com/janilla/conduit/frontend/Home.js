/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import Feeds from './Feeds.js';

class Home {

	tag;

	title = 'Home';

	get navItems() {
		const i = [
			{ text: 'Global Feed' }
		];
		if (this.tag)
			i.push({ text: `<i class="ion-pound"></i>${this.tag}` });
		i.at(-1).active = 'active';
		return i;
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		switch (key) {
			case undefined:
				const s = await fetch(`${this.conduit.backendUrl}/api/tags`, {
					headers: this.conduit.backendHeaders
				});
				if (s.ok)
					this.tags = (await s.json()).tags;
				return await r.render(this, t['Home']);

			case 'feeds':
				this.feedsRenderStack = [...r.stack];
				this.feeds = new Feeds();
				this.feeds.conduit = this.conduit;
				this.feeds.modifyParameters = p => {
					if (this.tag)
						p.set('tag', this.tag);
				};
				this.feeds.toggleClass = 'feed-toggle';
				return this.feeds;
		}

		const u = {
			'navItems': 'Home-navitem',
			'pageItems': 'Home-pageitem',
			'tagList': 'Article-tag',
			'tags': 'Home-tag'
		}[r.stack.at(-2).key];
		if (u)
			return await r.render(r.object[key], t[u]);
	}

	listen = () => {
		document.querySelector('.home-page').addEventListener('feedselect', this.handleFeedSelect);
		document.querySelector('.sidebar .tag-list').addEventListener('click', this.handleTagClick);
		this.feeds.listen();
	}

	handleFeedSelect = async e => {
		if (e.detail.navLink.parentElement.matches('.nav-item:first-child'))
			delete this.tag;
	}

	handleTagClick = async e => {
		e.preventDefault();
		const a = e.target.closest('.tag-pill');
		if (!a)
			return;
		this.tag = a.textContent;
		this.feeds.pageNumber = 1;
		this.feeds.refresh();
	}
}

export default Home;
