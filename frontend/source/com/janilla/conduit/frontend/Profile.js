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
import ArticleList from './ArticleList.js';
import FollowButton from './FollowButton.js';
import Tabs from './Tabs.js';

class Profile {

	selector;

	title = 'Profile';

	engine;

	profile;

	followButton;

	tab = 'author';

	get username() {
		return location.hash.substring(3);
	}

	get tabItems() {
		const i = [{
			name: 'author',
			text: 'My Articles'
		}, {
			name: 'favorited',
			text: 'Favorited Articles'
		}];
		i.find(j => j.name === this.tab).active = 'active';
		return i;
	}

	render = async e => {
		return await e.match([this], async (_, o) => {
			this.engine = e.clone();
			const a = e.app.api;
			const s = await fetch(`${a.url}/profiles/${this.username}`, {
				headers: a.headers
			});
			if (s.ok)
				this.profile = (await s.json()).profile;
			o.template = 'Profile';
		}) || await e.match([this, 'action'], (_, o) => {
			if (this.profile.username === this.engine.app.currentUser?.username)
				o.template = 'Profile-edit';
			else {
				this.followButton = new FollowButton();
				this.followButton.user = this.profile;
				this.followButton.selector = () => this.selector().querySelector('p').nextElementSibling;
				o.value = this.followButton;
			}
		}) || await e.match([this, 'tabs'], (_, o) => {
			this.tabs = new Tabs();
			this.tabs.selector = () => this.selector().querySelector('.feed-toggle').firstElementChild;
			this.tabs.items = this.tabItems;
			o.value = this.tabs;
		}) || await e.match([this, 'articleList'], (_, o) => {
			this.articleList = new ArticleList();
			this.articleList.selector = () => this.selector().querySelector('.feed-toggle').nextElementSibling;
			o.value = this.articleList;
		});
	}

	listen = () => {
		const e = this.selector();
		e.addEventListener('tabselect', this.handleTabSelect);
		e.addEventListener('articlesfetch', this.handleArticlesFetch);
		this.followButton?.listen();
		this.tabs.listen();
		this.articleList.listen();
	}

	handleTabSelect = async e => {
		this.tab = e.detail.tab;
		await this.articleList.refresh();
	}

	handleArticlesFetch = async e => {
		const u = e.detail.url;
		u.searchParams.set(this.tab, this.profile.username);
	}
}

export default Profile;
