function estado(val)
  {
    if(val == true)
	  { 
	 	  if (flag == false)
	    {
        matiz = new SFColor(1.0,0.0,0.0);
        flag = true;
		 	}
      else
	    {
	      matiz = new SFColor(0.0,0.0,0.0);
        flag = false; 
		  }   
    }	
  }