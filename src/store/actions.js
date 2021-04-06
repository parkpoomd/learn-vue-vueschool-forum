import firebase from 'firebase'

export default {
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

  fetchCategory: ({ dispatch }, { id }) =>
    dispatch('fetchItem', {
      resource: 'categories',
      id,
      text: 'category:',
    }),
  fetchForum: ({ dispatch }, { id }) =>
    dispatch('fetchItem', {
      resource: 'forums',
      id,
      text: 'forum:',
    }),
  fetchThread: ({ dispatch }, { id }) =>
    dispatch('fetchItem', {
      resource: 'threads',
      id,
      text: 'thread:',
    }),
  fetchPost: ({ dispatch }, { id }) =>
    dispatch('fetchItem', { resource: 'posts', id, text: 'post:' }),
  fetchUser: ({ dispatch }, { id }) =>
    dispatch('fetchItem', { resource: 'users', id, text: 'user:' }),

  fetchCategories: ({ dispatch }, { ids }) =>
    dispatch('fetchItems', {
      resource: 'categories',
      ids,
      text: 'categories:',
    }),
  fetchForums: ({ dispatch }, { ids }) =>
    dispatch('fetchItems', {
      resource: 'forums',
      ids,
      text: 'forums:',
    }),
  fetchThreads: ({ dispatch }, { ids }) =>
    dispatch('fetchItems', {
      resource: 'threads',
      ids,
      text: 'threads:',
    }),
  fetchPosts: ({ dispatch }, { ids }) =>
    dispatch('fetchItems', {
      resource: 'posts',
      ids,
      text: 'posts:',
    }),
  fetchUsers: ({ dispatch }, { ids }) =>
    dispatch('fetchItems', {
      resource: 'users',
      ids,
      text: 'users:',
    }),

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
}
