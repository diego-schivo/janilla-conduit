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

class Profile {

	conduit;

	filter = 'author';

	profile;

	renderStack;

	title = 'Profile';

	get username() {
		return location.hash.substring(3);
	}

	get buttons() {
		if (this.profile.username === this.conduit.user?.username)
			return [{
				class: 'btn-outline-secondary',
				name: 'edit',
				icon: 'ion-gear-a',
				text: 'Edit Profile Settings'
			}];
		else {
			const f = this.profile.following;
			return [{
				class: f ? 'btn-secondary' : 'btn-outline-secondary',
				name: f ? 'unfollow' : 'follow',
				icon: 'ion-plus-round',
				text: `${f ? 'Unfollow' : 'Follow'} ${this.profile.username}`
			}];
		}
	}

	get navItems() {
		const a = [{
			name: 'author',
			text: 'My Articles'
		}, {
			name: 'favorited',
			text: 'Favorited Articles'
		}];
		a.find(e => e.name === this.filter).active = 'active';
		return a;
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		let s, j;
		switch (key) {
			case undefined:
				this.renderStack = [...r.stack];
				s = await fetch(`${this.conduit.backendUrl}/api/profiles/${this.username}`, {
					headers: this.conduit.backendHeaders
				});
				if (s.ok)
					this.profile = (await s.json()).profile;
				return await r.render(this, t['Profile']);

			case 'info':
				return await r.render(null, t['Profile-info']);

			case 'feeds':
				this.feedsRenderStack = [...r.stack];
				this.feeds = new Feeds();
				this.feeds.conduit = this.conduit;
				this.feeds.modifyParameters = p =>
					p.set(this.filter, this.profile.username);
				this.feeds.toggleClass = 'articles-toggle';
				return this.feeds;
		}

		if (typeof key === 'string' && Object.hasOwn(this.profile, key))
			return this.profile[key];

		const u = r.stack.length >= 2 && {
			'buttons': 'Profile-button'
		}[r.stack.at(-2).key];
		if (u)
			return await r.render(r.stack.at(-1).object[key], t[u]);
	}

	listen = () => {
		document.querySelector('.profile-page').addEventListener('feedselect', this.handleFeedSelect);
		document.querySelector('.user-info').addEventListener('click', this.handleUserInfoClick);
		this.feeds.listen();
	}

	handleFeedSelect = async e => {
		this.filter = e.detail.navLink.getAttribute('href').substring(1);
	}

	handleUserInfoClick = async e => {
		const b = e.target.closest('button');
		if (!b)
			return;
		e.preventDefault();

		switch (b.name) {
			case 'edit':
				location.hash = '#/settings';
				break;

			case 'follow':
			case 'unfollow':
				if (this.conduit.user) {
					const s = await fetch(`${this.conduit.backendUrl}/api/profiles/${this.profile.username}/follow`, {
						method: b.name === 'follow' ? 'POST' : 'DELETE',
						headers: this.conduit.backendHeaders
					});
					if (s.ok)
						this.profile = (await s.json()).profile;
					const r = this.conduit.rendering;
					const t = this.conduit.templates;
					const h = await r.render(this, t['Profile-info'], this.renderStack);
					document.querySelector('.user-info').outerHTML = h;
					this.listen();
				} else location.hash = '#/register';
				break;
		}
	}
}

export default Profile;
