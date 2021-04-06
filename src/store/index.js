import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase'
import { countObjectProperties } from '@/utils'

Vue.use(Vuex)

const makeAppendChildToParentMutation = ({ parent, child }) => (
  state,
  { childId, parentId }
) => {
  const resource = state[parent][parentId] // user.name === user['name']
  if (!resource[child]) {
    Vue.set(resource, child, {})
  }
  Vue.set(resource[child], childId, childId)
}

export default new Vuex.Store({
  state: {
    categories: {},
    forums: {},
    threads: {},
    posts: {},
    users: {},
    authId: 'FsCDAk9w8NeXEceLV87arpsXjnQ2',
  },

  getters: {
    authUser(state) {
      // return state.users[state.authId]
      return {}
    },

    userThreadsCount: (state) => (id) =>
      countObjectProperties(state.users[id].threads),
    userPostsCount: (state) => (id) =>
      countObjectProperties(state.users[id].posts),
    threadRepliesCount: (state) => (id) =>
      countObjectProperties(state.threads[id].posts) - 1,
  },

  actions: {
    createPost({ commit, state }, post) {
      const postId = 'greatPost' + Math.random()
      post['.key'] = postId
      post.userId = state.authId
      post.publishedAt = Math.floor(Date.now() / 1000)

      commit('setPost', { post, postId })
      commit('appendPostToThread', { parentId: post.threadId, childId: postId })
      commit('appendPostToUser', { parentId: post.userId, childId: postId })
      return Promise.resolve(state.posts[postId])
    },

    createThread({ state, commit, dispatch }, { text, title, forumId }) {
      return new Promise((resolve) => {
        const threadId = 'greatThread' + Math.random()
        const userId = state.authId
        const publishedAt = Math.floor(Date.now() / 1000)

        const thread = {
          '.key': threadId,
          title,
          forumId,
          publishedAt,
          userId,
        }

        commit('setThread', { threadId, thread })
        commit('appendThreadToForum', { parentId: forumId, childId: threadId })
        commit('appendThreadToUser', { parentId: userId, childId: threadId })

        dispatch('createPost', { text, threadId }).then((post) => {
          commit('setThread', {
            threadId,
            thread: { ...thread, firstPostId: post['.key'] },
          })
        })
        resolve(state.threads[threadId])
      })
    },

    updateThread({ state, commit, dispatch }, { title, text, id }) {
      return new Promise((resolve) => {
        const thread = state.threads[id]
        const newThread = { ...thread, title }
        commit('setThread', { thread: newThread, threadId: id })

        dispatch('updatePost', { id: thread.firstPostId, text }).then(() => {
          resolve(newThread)
        })
      })
    },

    updatePost({ state, commit }, { id, text }) {
      return new Promise((resolve) => {
        const post = state.posts[id]
        commit('setPost', {
          postId: id,
          post: {
            ...post,
            text,
            edited: { at: Math.floor(Date.now() / 1000), by: state.authId },
          },
        })
        resolve(post)
      })
    },

    updateUser({ commit }, user) {
      commit('setUser', { userId: user['.key'], user })
    },

    fetchCategory({ dispatch }, { id }) {
      return dispatch('fetchItem', {
        resource: 'categories',
        id,
        text: 'category:',
      })
    },

    fetchForum({ dispatch }, { id }) {
      return dispatch('fetchItem', {
        resource: 'forums',
        id,
        text: 'forum:',
      })
    },

    fetchThread({ dispatch }, { id }) {
      return dispatch('fetchItem', {
        resource: 'threads',
        id,
        text: 'thread:',
      })
    },

    fetchPost({ dispatch }, { id }) {
      return dispatch('fetchItem', { resource: 'posts', id, text: 'post:' })
    },

    fetchUser({ dispatch }, { id }) {
      return dispatch('fetchItem', { resource: 'users', id, text: 'user:' })
    },

    fetchCategories(context, { ids }) {
      return context.dispatch('fetchItems', {
        resource: 'categories',
        ids,
        text: 'categories:',
      })
    },

    fetchForums(context, { ids }) {
      return context.dispatch('fetchItems', {
        resource: 'forums',
        ids,
        text: 'forums:',
      })
    },

    fetchThreads(context, { ids }) {
      return context.dispatch('fetchItems', {
        resource: 'threads',
        ids,
        text: 'threads:',
      })
    },

    fetchPosts(context, { ids }) {
      return context.dispatch('fetchItems', {
        resource: 'posts',
        ids,
        text: 'posts:',
      })
    },

    fetchUsers(context, { ids }) {
      return context.dispatch('fetchItems', {
        resource: 'users',
        ids,
        text: 'users:',
      })
    },

    fetchAllCategories({ state, commit }) {
      console.log('categories', 'all')
      return new Promise((resolve, reject) => {
        firebase
          .database()
          .ref('categories')
          .once('value', (snapshot) => {
            const categoriesObject = snapshot.val()
            Object.keys(categoriesObject).forEach((categoryId) => {
              const category = categoriesObject[categoryId]
              commit('setItem', {
                resource: 'categories',
                id: categoryId,
                item: category,
              })
            })
            resolve(Object.values(state.categories))
          })
      })
    },

    fetchItem({ state, commit }, { id, text, resource }) {
      console.log(text, id)
      return new Promise((resolve, reject) => {
        firebase
          .database()
          .ref(resource)
          .child(id)
          .once('value', (snapshot) => {
            commit('setItem', {
              resource,
              id: snapshot.key,
              item: snapshot.val(),
            })
            resolve(state[resource][id])
          })
      })
    },

    fetchItems({ dispatch }, { ids, resource, text }) {
      ids = Array.isArray(ids) ? ids : Object.keys(ids)
      return Promise.all(
        ids.map((id) => dispatch('fetchItem', { id, resource, text }))
      )
    },
  },

  mutations: {
    setPost(state, { post, postId }) {
      Vue.set(state.posts, postId, post)
    },

    setUser(state, { user, userId }) {
      Vue.set(state.users, userId, user)
    },

    setThread(state, { thread, threadId }) {
      Vue.set(state.threads, threadId, thread)
    },

    setItem(state, { item, id, resource }) {
      item['.key'] = id
      Vue.set(state[resource], id, item)
    },

    appendPostToThread: makeAppendChildToParentMutation({
      parent: 'threads',
      child: 'posts',
    }),

    appendPostToUser: makeAppendChildToParentMutation({
      parent: 'users',
      child: 'posts',
    }),

    appendThreadToForum: makeAppendChildToParentMutation({
      parent: 'forums',
      child: 'threads',
    }),

    appendThreadToUser: makeAppendChildToParentMutation({
      parent: 'users',
      child: 'threads',
    }),
  },
})
