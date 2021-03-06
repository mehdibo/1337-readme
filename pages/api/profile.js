import nc from 'next-connect'
import cache from 'memory-cache'
import imageToBase64 from 'image-to-base64'
import { renderToStaticMarkup } from 'react-dom/server'

import fortyTwo from '../../middlewares/42'
import Profile from '../../components/cards/Profile'

const handler = nc()

handler.use(fortyTwo)

handler.get(async (req, res) => {
  const {
    login,
    cursus,
    email: queryEmail,
    leet_logo,
    forty_two_network_logo,
    dark,
  } = req.query

  let userData
  const userCache = cache.get(`login:${login}`)

  if (userCache) userData = userCache
  else {
    userData = await req.fortyTwo.getUser(login)
    cache.put(`login:${login}`, userData, 7200000)
  }

  const {
    email,
    first_name,
    last_name,
    image_url,
    'staff?': isStaff,
    cursus_users: cursuses,
  } = userData

  const getCursus = cursuses.find(({ cursus: { slug } }) => slug === cursus)
  const isPisciner = cursuses.length === 1 && cursuses[0].cursus_id === 6
  let image
  const imageCache = cache.get(`image:${login}`)
  if (imageCache) image = imageCache
  else {
    image = await imageToBase64(image_url)
    cache.put(`image:${login}`, image, 7200000)
  }

  const user = {
    login,
    fullName: `${first_name} ${last_name}`,
    email: queryEmail !== 'hide' && email,
    image,
    isPisciner,
    isStaff,
    cursus: !isStaff &&
      getCursus && {
        grade: getCursus.grade,
        name: getCursus.cursus.name,
        level: getCursus.level,
      },
    leetLogo: leet_logo !== 'hide',
    fortyTwoLogo: forty_two_network_logo !== 'hide',
    isDark: dark === 'true',
  }

  res.setHeader('Content-Type', 'image/svg+xml')
  res.end(renderToStaticMarkup(<Profile user={user} />))
})

export default handler
