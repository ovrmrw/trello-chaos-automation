process.on('unhandledRejection', (reason, promise) => {
  console.log('//// UNHANDLED REJECTION (FROM) ' + '/'.repeat(100));
  console.error(reason);
  console.log('//// UNHANDLED REJECTION (TO) ' + '/'.repeat(100));
  throw new Error('FORCE SHUTDOWN');
});
