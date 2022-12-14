import pkg from '../package.json'
import { Octokit } from '@octokit/rest'
import { resolve, join } from 'path'
import fs from 'fs'

console.log('working dir:', resolve('./'))

const asset_dir = resolve('./src-tauri/target/release/bundle/msi')
const asset_bin = `${pkg.name}_${pkg.version}_x64_en-US.msi.zip`
const asset_sig = `${pkg.name}_${pkg.version}_x64_en-US.msi.zip.sig`

const octokit = new Octokit({ auth: process.env.GH_FULL_CONTROL })

const {
    data: { login },
} = await octokit.rest.users.getAuthenticated()
console.log('Hello, %s', login)

const owner = 'aravindhnivas'
const repo = pkg.name

// Create the release
const Release = await octokit.rest.repos.createRelease({
    owner, // the owner of the repository
    repo, // the name of the repository
    tag_name: `v${pkg.version}`, // the name of the release
    target_commitish: 'main', // the name of the branch
    name: `Release v${pkg.version}`, // the title of the release
    draft: false,
})

// Upload an asset to the release
const Sig_asset = await octokit.rest.repos.uploadReleaseAsset({
    owner, // the owner of the repository
    repo, // the name of the repository
    release_id: Release.data.id, // the ID of the release
    name: asset_sig, // the name of the asset
    data: fs.readFileSync(join(asset_dir, asset_sig)), // the contents of the asset
    contentType: 'text/plain', // the content type of the asset
})

console.log(`${Sig_asset.data.name}: ${Sig_asset.data.state}`)

const data = await fs.promises.readFile(join(asset_dir, asset_bin))
console.log('Uploading binaries. This may take a while, please wait...')

// Upload an asset to the release
const Bin_asset = await octokit.rest.repos.uploadReleaseAsset({
    owner: 'aravindhnivas', // the owner of the repository
    repo: pkg.name, // the name of the repository
    release_id: Release.data.id, // the ID of the release
    name: asset_bin, // the name of the asset
    data,
    contentType: 'application/zip', // the content type of the asset
})

console.log(`${Bin_asset.data.name}: ${Bin_asset.data.state}`)
