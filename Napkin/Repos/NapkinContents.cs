using System;
using System.Collections.Concurrent;
using System.Linq;
using Napkin.Model;

namespace Napkin.Repos
{
    public class NapkinContents
    {
		private readonly ConcurrentDictionary<String, ConcurrentQueue<Item>> Content = new ConcurrentDictionary<string, ConcurrentQueue<Item>>();

	    public void AddItem(String napkinId, Item item)
	    {
		    var napkin = GetNapkin(napkinId);

		    var replaced = false;
		    var found = napkin.SingleOrDefault(x => x.Id == item.Id);
		    if (found != null)
		    {
			    replaced = true;
			    found.CopyProperties(item);
		    }

			if (!replaced)
				napkin.Enqueue(item);
	    }

	    public Item[] GetAll(String napkinId)
	    {
		    var napkin = GetNapkin(napkinId);
			
			return napkin.ToArray();
	    }

	    private ConcurrentQueue<Item> GetNapkin(string napkinID)
	    {
			ConcurrentQueue<Item> result = null;

		    if (Content.TryGetValue(napkinID, out result))
			    return result;

			result = new ConcurrentQueue<Item>();
		    Content.TryAdd(napkinID, result);

		    return result;
	    }
    }
}
