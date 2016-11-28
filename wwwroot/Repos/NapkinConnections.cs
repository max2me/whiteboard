using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Napkin.wwwroot.Repos
{
    public class NapkinConnections
    {
		private readonly ConcurrentDictionary<string, string> ConnectionGroups = new ConcurrentDictionary<string, string>();

		public void AssignToNapkin(string connectionId, string napkin)
		{
			ConnectionGroups[connectionId] = napkin;
		}

		public string GetNapkin(string connectionId)
		{
			return ConnectionGroups[connectionId];
		}
	}
}
