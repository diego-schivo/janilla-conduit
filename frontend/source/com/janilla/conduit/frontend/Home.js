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
import PopularTags from './PopularTags.js';
import Tabs from './Tabs.js';

class Home {

	selector;

	engine;

	title = 'Home';

	tabs;

	articleList;

	popularTags;

	activeTab;

	selectedTag;

	get tabItems() {
		const i = [];
		if (this.engine.app.currentUser)
			i.push({
				name: 'feed',
				text: 'Your Feed'
			});
		i.push({
			name: 'all',
			text: 'Global Feed'
		});
		if (this.activeTab === 'tag')
			i.push({
				name: 'tag',
				text: `<i class="ion-pound"></i>${this.selectedTag}`
			});
		i.find(j => j.name === this.activeTab).active = 'active';
		return i;
	}

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			this.activeTab = engine.app.currentUser ? 'feed' : 'all';
			return await engine.render(this, 'Home');
		}

		if (engine.isRendering(this, 'banner'))
			return !engine.app.currentUser ? await engine.render(this, 'Home-banner') : null;

		if (engine.isRendering(this, 'tabs')) {
			this.tabs = new Tabs();
			this.tabs.selector = () => this.selector()?.querySelector('.feed-toggle')?.firstElementChild;
			this.tabs.items = this.tabItems;
			return this.tabs;
		}

		if (engine.isRendering(this, 'articleList')) {
			this.articleList = new ArticleList();
			this.articleList.selector = () => this.selector()?.querySelector('.feed-toggle')?.nextElementSibling;
			return this.articleList;
		}

		if (engine.isRendering(this, 'popularTags')) {
			this.popularTags = new PopularTags();
			this.popularTags.selector = () => this.selector()?.querySelector('.sidebar')?.firstElementChild;
			return this.popularTags;
		}
	}

	listen = () => {
		const e = this.selector();
		e.addEventListener('tabselect', this.handleTabSelect);
		e.addEventListener('articlesfetch', this.handleArticlesFetch);
		e.addEventListener('tagselect', this.handleTagSelect);
		this.tabs.listen();
		this.articleList.listen();
		this.popularTags.listen();
	}

	handleTabSelect = async e => {
		this.activeTab = e.detail.tab;
		if (this.activeTab !== 'tag' && this.selectedTag) {
			e.preventDefault();
			delete this.selectedTag;
			this.tabs.items = this.tabItems;
			await this.tabs.refresh();
		}
		await this.articleList.refresh();
	}

	handleArticlesFetch = async e => {
		const u = e.detail.url;
		if (this.activeTab === 'feed')
			u.pathname += '/feed';
		if (this.selectedTag)
			u.searchParams.set('tag', this.selectedTag);
	}

	handleTagSelect = async e => {
		this.activeTab = 'tag';
		this.selectedTag = e.detail.tag;
		this.tabs.items = this.tabItems;
		await this.tabs.refresh();
		await this.articleList.refresh();
	}
}

export default Home;
